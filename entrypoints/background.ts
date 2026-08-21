// # 后台脚本：侧边栏行为 + 消息中枢（职位记录、HR 标记、调试开关、屏蔽公司、AI 流式生成）
import { z } from 'zod';

import {
  AUTH_ERROR_MARKER,
  cancelAiStream,
  generateFollowUp,
  generateGreeting,
  generateOrganizedResume,
  generateRejectionFeedback,
  generateReply,
  type StreamCallbacks,
  startAiStream,
} from '@/shared/infra/ai';
import { onMessage } from '@/shared/infra/messaging';
import {
  aiPreferenceStore,
  aiVendorStore,
  blockedCompanyStore,
  chatMessageStore,
  debugSettingStore,
  hrStore,
  jdStore,
  updateCheckStore,
} from '@/shared/infra/storage';
import {
  GITHUB_RELEASE_API_URL,
  JSDELIVR_PACKAGE_URL,
} from '@/shared/lib/update-source';
import { compareVersions } from '@/shared/lib/version-compare';
import type {
  AiVendorRecord,
  FollowUpInput,
  GreetingInput,
  PageJobContext,
  RejectionFeedbackInput,
  ReplyInput,
  ThinkingMode,
  UpdateCheck,
  UpdateCheckStatus,
} from '@/shared/zod';
import {
  blockedCompanyNamesSchema,
  chatMessageInputSchema,
  debugLogLinesSchema,
  debugSettingsSchema,
  excludedHrIdsResponseSchema,
  followUpInputSchema,
  githubReleaseResponseSchema,
  greetingInputSchema,
  hrInputSchema,
  jsdelivrPackageResponseSchema,
  pageJobContextSchema,
  rejectionFeedbackInputSchema,
  replyInputSchema,
  selectedJdSchema,
  UPDATE_CHECK_KEY,
} from '@/shared/zod';

// 版本检查缓存有效期（1 小时）与单次请求超时（10 秒）
const UPDATE_CHECK_TTL_MS = 60 * 60 * 1000;
const UPDATE_FETCH_TIMEOUT_MS = 10_000;

// 进行中的检查：并发触发共享同一次网络检查
let inFlightCheck: Promise<UpdateCheckStatus> | undefined;

// 请求 JSON 并按 schema 校验：任一环节失败抛错，由调用方走兜底
const fetchJsonOf = async <T>(
  url: string,
  schema: z.ZodType<T>,
): Promise<T> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(UPDATE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
};

// 由检查结果计算协议状态：附加当前版本与是否有更新
const statusOf = ({
  latestVersion,
  releaseUrl,
  source,
  currentVersion,
}: Omit<UpdateCheck, 'key' | 'lastCheckedAt'> & {
  currentVersion: string;
}): UpdateCheckStatus => ({
  latestVersion,
  releaseUrl,
  source,
  currentVersion,
  hasUpdate:
    latestVersion !== null &&
    compareVersions(latestVersion, currentVersion) > 0,
});

// > 检查扩展更新：缓存不足 1 小时直接返回；过期才请求网络，GitHub 主源失败走 jsDelivr 镜像，全失败记未知且同样缓存 1 小时
const handleCheckUpdate = async (): Promise<UpdateCheckStatus> => {
  const currentVersion = browser.runtime.getManifest().version;
  const cached = await updateCheckStore.readUpdateCheck();
  if (
    cached !== undefined &&
    Date.now() - cached.lastCheckedAt < UPDATE_CHECK_TTL_MS
  ) {
    return statusOf({ ...cached, currentVersion });
  }
  if (inFlightCheck === undefined) {
    inFlightCheck = (async () => {
      let latestVersion: string | null = null;
      let releaseUrl: string | null = null;
      let source: UpdateCheck['source'] = 'unknown';
      try {
        const release = await fetchJsonOf(
          GITHUB_RELEASE_API_URL,
          githubReleaseResponseSchema,
        );
        latestVersion = release.tag_name.replace(/^v/, '');
        releaseUrl = release.html_url;
        source = 'github';
      } catch {
        try {
          const pkg = await fetchJsonOf(
            JSDELIVR_PACKAGE_URL,
            jsdelivrPackageResponseSchema,
          );
          latestVersion = pkg.version.replace(/^v/, '');
          source = 'jsdelivr';
        } catch {
          // 兜底也失败：记未知，静默返回
        }
      }
      const record: UpdateCheck = {
        key: UPDATE_CHECK_KEY,
        lastCheckedAt: Date.now(),
        latestVersion,
        releaseUrl,
        source,
      };
      await updateCheckStore.saveUpdateCheck(record);
      return statusOf({ ...record, currentVersion });
    })().finally(() => {
      inFlightCheck = undefined;
    });
  }
  return inFlightCheck;
};

// 解析当前选中厂商：授权小窗与生成上下文共用同一厂商选择逻辑，避免选择漂移
const resolveActiveVendor = async (): Promise<AiVendorRecord> => {
  const vendors = await aiVendorStore.readAllVendors();
  const preference = await aiPreferenceStore.readAiPreference();
  const vendor =
    vendors.find((item) => item.vendorId === preference.vendorId) ?? vendors[0];
  if (vendor === undefined) {
    throw new Error('未配置 AI 厂商：请先到侧边栏「AI 厂商」页添加并拉取模型');
  }
  return vendor;
};

// 解析生成上下文：全局偏好选中的厂商/模型/思考档位 + 权限预检（无手势环境用 contains）
const resolveGenerationContext = async (): Promise<{
  vendor: AiVendorRecord;
  modelId: string;
  thinkingMode: ThinkingMode;
}> => {
  const vendor = await resolveActiveVendor();
  const preference = await aiPreferenceStore.readAiPreference();
  const modelId =
    vendor.models.find((model) => model === preference.modelId) ??
    vendor.models[0];
  if (modelId === undefined) {
    throw new Error('未配置 AI 厂商：请先到侧边栏「AI 厂商」页添加并拉取模型');
  }
  // > 后台无用户手势不能申请权限：用 contains 预检（无手势限制），未授权时给出可读指引
  const origin = new URL(vendor.baseUrl).origin;
  const granted = await browser.permissions.contains({
    origins: [`${origin}/*`],
  });
  if (!granted) {
    throw new Error(
      `${AUTH_ERROR_MARKER}：请先在侧边栏「AI 厂商」页拉取一次模型完成授权`,
    );
  }
  return {
    vendor,
    modelId,
    thinkingMode: preference.thinkingMode,
  };
};

// 生成下一条回复：优先用库中完整 JD，无记录时用输入兜底信息，带 HR 信息
const handleGenerateReply = async ({
  input,
  stream,
}: {
  input: ReplyInput;
  stream: StreamCallbacks;
}): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateReply({
    jd,
    messages: input.messages,
    vendor,
    modelId,
    thinkingMode,
    hr: input.hr,
    requestPermission: false,
    stream,
  });
};

// 生成跟进消息：沟通暂时中断时，结合 JD、HR、简历与当前聊天记录
const handleFollowUp = async ({
  input,
  stream,
}: {
  input: FollowUpInput;
  stream: StreamCallbacks;
}): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateFollowUp({
    jd,
    hr: input.hr,
    messages: input.messages,
    vendor,
    modelId,
    thinkingMode,
    requestPermission: false,
    stream,
  });
};

// 生成打招呼语句：首次联系时，结合 JD 与 HR 信息
const handleGreeting = async ({
  input,
  stream,
}: {
  input: GreetingInput;
  stream: StreamCallbacks;
}): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateGreeting({
    jd,
    hr: input.hr,
    vendor,
    modelId,
    thinkingMode,
    requestPermission: false,
    stream,
  });
};

// 生成请教反馈消息：优先用库中完整 JD，无记录时用输入兜底信息，带 HR 信息
const handleRejectionFeedback = async ({
  input,
  stream,
}: {
  input: RejectionFeedbackInput;
  stream: StreamCallbacks;
}): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateRejectionFeedback({
    jd,
    messages: input.messages,
    vendor,
    modelId,
    thinkingMode,
    requestPermission: false,
    hr: input.hr,
    stream,
  });
};

// AI 梳理简历：用全局厂商/模型/思考档位整理库中简历，梳理结果由侧边栏落库并备份原件
const handleOrganizeResume = async (): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  return generateOrganizedResume({
    vendor,
    modelId,
    thinkingMode,
    requestPermission: false,
  });
};

// 解析当前选中厂商的接口地址：授权小窗据此打开对应授权页
const resolveActiveVendorOrigin = async (): Promise<string> =>
  new URL((await resolveActiveVendor()).baseUrl).origin;

// 广播通知：向各 Boss直聘 标签页的桥推送指定类型，由桥转发给主世界
const broadcastNotify = async (type: string): Promise<void> => {
  const tabs = await browser.tabs.query({ url: '*://*.zhipin.com/*' });
  await Promise.all(
    tabs.map(({ id }) =>
      id === undefined
        ? undefined
        : browser.tabs.sendMessage(id, { hiJobNotify: type }).catch(() => {}),
    ),
  );
};

// 读取当前 BOSS 页面的采集日志：转发查询到最近聚焦窗口的激活 BOSS 标签页
const handlePageDebugLogs = async (): Promise<string[]> => {
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
    url: '*://*.zhipin.com/*',
  });
  if (tab?.id === undefined) {
    return [];
  }
  try {
    const response = await browser.tabs.sendMessage(tab.id, {
      hiJobQuery: 'debug-logs',
    });
    const parsed = debugLogLinesSchema.safeParse(response);
    return parsed.success ? parsed.data : [];
  } catch {
    // 页面无应答（内容脚本未注入或已休眠）时返回空
    return [];
  }
};

// 读取当前 BOSS 页面的职位上下文：判断页面类型并转发查询当前职位数据
const handlePageJobContext = async (): Promise<PageJobContext> => {
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
    url: '*://*.zhipin.com/*',
  });
  if (tab?.id === undefined) {
    return { page: 'other' };
  }
  try {
    const response = await browser.tabs.sendMessage(tab.id, {
      hiJobQuery: 'job-context',
    });
    const parsed = pageJobContextSchema.safeParse(response);
    return parsed.success ? parsed.data : { page: 'other' };
  } catch {
    // 页面无应答（内容脚本未注入或已休眠）时返回其他页面
    return { page: 'other' };
  }
};

// 广播职位上下文变更：通知扩展上下文（含侧边栏）刷新当前职位信息
const broadcastJobContextChanged = async (): Promise<void> => {
  await browser.runtime
    .sendMessage({ hiJobNotify: 'job-context-changed' })
    .catch(() => {});
};

export default defineBackground(() => {
  // 点击工具栏图标直接打开侧边栏面板（Chrome 专属 API，Firefox 自动跳过）
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });

  // > 类型安全消息中枢：数据经 zod 校验后落库/生成，handler 返回值即应答
  onMessage('recordJd', async ({ data }) => {
    const parsed = selectedJdSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 职位记录参数不合法');
    }
    await jdStore.saveSelectedJd({ jd: parsed.data });
  });
  onMessage('saveHr', async ({ data }) => {
    const parsed = hrInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: HR 档案上报参数不合法');
    }
    await hrStore.saveHr(parsed.data);
  });
  onMessage('syncHrs', async ({ data }) => {
    const parsed = z.array(hrInputSchema).safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: HR 批量同步参数不合法');
    }
    await hrStore.saveHrs(parsed.data);
    // 广播到各标签页：职位列表页「已沟通」标记按最新 HR 档案重拉
    await broadcastNotify('hrs-changed');
  });
  onMessage('saveChatMessages', async ({ data }) => {
    const parsed = z.array(chatMessageInputSchema).safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 聊天消息参数不合法');
    }
    await chatMessageStore.saveChatMessages(parsed.data);
  });
  onMessage('getExcludedHrIds', () =>
    hrStore
      .readExcludedHrIds()
      .then((ids) => excludedHrIdsResponseSchema.parse(ids)),
  );
  onMessage('getChattedCompanyNames', () => hrStore.readChattedBrandNames());
  onMessage('hrsChanged', () => broadcastNotify('hrs-changed'));
  onMessage('getBlockedCompanyNames', () =>
    blockedCompanyStore.readBlockedCompanies(),
  );
  onMessage('saveBlockedCompanies', async ({ data }) => {
    const parsed = blockedCompanyNamesSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 屏蔽公司名单参数不合法');
    }
    await blockedCompanyStore.saveBlockedCompanies(parsed.data);
    // 广播到各标签页，职位列表页遮罩即时增减
    await broadcastNotify('blocked-companies-changed');
  });
  onMessage('getDebugSettings', () => debugSettingStore.readDebugSettings());
  onMessage('getAiPreference', () => aiPreferenceStore.readAiPreference());
  // 打开授权小窗：聊天页未授权报错的一键入口，开窗无手势限制，权限申请在小窗内点击完成
  onMessage('openAiVendorAuth', async () => {
    const origin = await resolveActiveVendorOrigin();
    await browser.windows.create({
      type: 'popup',
      url: browser.runtime.getURL(
        `/auth.html?origin=${encodeURIComponent(origin)}`,
      ),
      width: 400,
      height: 320,
    });
  });
  onMessage('getPageDebugLogs', () => handlePageDebugLogs());
  onMessage('getPageJobContext', () => handlePageJobContext());
  onMessage('jobContextChanged', () => broadcastJobContextChanged());
  onMessage('saveDebugSettings', async ({ data }) => {
    const parsed = debugSettingsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 调试设置参数不合法');
    }
    await debugSettingStore.saveDebugSettings(parsed.data);
    // 广播到各标签页，探测脚本即时注入/移除按钮
    await broadcastNotify('debug-settings-changed');
  });
  // > AI 生成一律流式：启动即回 requestId，增量与终态经 hiJobStream 推送发起标签页
  onMessage('greeting', ({ data, sender }) => {
    const parsed = greetingInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('打招呼参数不合法');
    }
    return startAiStream({
      tabId: sender.tab?.id,
      task: (stream) => handleGreeting({ input: parsed.data, stream }),
    });
  });
  onMessage('followUp', ({ data, sender }) => {
    const parsed = followUpInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('跟进参数不合法');
    }
    return startAiStream({
      tabId: sender.tab?.id,
      task: (stream) => handleFollowUp({ input: parsed.data, stream }),
    });
  });
  onMessage('generateReply', ({ data, sender }) => {
    const parsed = replyInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('回复生成参数不合法');
    }
    return startAiStream({
      tabId: sender.tab?.id,
      task: (stream) => handleGenerateReply({ input: parsed.data, stream }),
    });
  });
  onMessage('rejectionFeedback', ({ data, sender }) => {
    const parsed = rejectionFeedbackInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('请教反馈参数不合法');
    }
    return startAiStream({
      tabId: sender.tab?.id,
      task: (stream) => handleRejectionFeedback({ input: parsed.data, stream }),
    });
  });
  onMessage('cancelAiStream', ({ data }) => {
    if (typeof data === 'string' && data !== '') {
      cancelAiStream(data);
    }
  });
  onMessage('organizeResume', () => handleOrganizeResume());
  onMessage('checkUpdate', () => handleCheckUpdate());
});
