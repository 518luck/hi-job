// # 后台脚本：侧边栏行为 + 消息中枢（职位记录、HR 标记、调试开关、屏蔽公司、AI 生成）
import { z } from 'zod';

import {
  generateFollowUp,
  generateGreeting,
  generateRejectionFeedback,
  generateReply,
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
} from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  FollowUpInput,
  GreetingInput,
  RejectionFeedbackInput,
  ReplyInput,
  ThinkingMode,
} from '@/shared/zod';
import {
  blockedCompanyNamesSchema,
  chatMessageInputSchema,
  debugLogLinesSchema,
  debugSettingsSchema,
  excludedHrIdsResponseSchema,
  followUpInputSchema,
  greetingInputSchema,
  hrInputSchema,
  rejectionFeedbackInputSchema,
  replyInputSchema,
  selectedJdSchema,
} from '@/shared/zod';

// 解析生成上下文：全局偏好选中的厂商/模型/思考档位 + 权限预检（无手势环境用 contains）
const resolveGenerationContext = async (): Promise<{
  vendor: AiVendorRecord;
  modelId: string;
  thinkingMode: ThinkingMode;
}> => {
  const vendors = await aiVendorStore.readAllVendors();
  // 优先用工作台全局选择的厂商与模型，无选择或选择失效时回退第一个厂商第一个模型
  const preference = await aiPreferenceStore.readAiPreference();
  const vendor =
    vendors.find((item) => item.vendorId === preference.vendorId) ?? vendors[0];
  const modelId =
    vendor?.models.find((model) => model === preference.modelId) ??
    vendor?.models[0];
  if (vendor === undefined || modelId === undefined) {
    throw new Error('未配置 AI 厂商：请先到侧边栏「AI 厂商」页添加并拉取模型');
  }
  // > 后台无用户手势不能申请权限：用 contains 预检（无手势限制），未授权时给出可读指引
  const origin = new URL(vendor.baseUrl).origin;
  const granted = await browser.permissions.contains({
    origins: [`${origin}/*`],
  });
  if (!granted) {
    throw new Error(
      '未授权访问 AI 厂商地址：请先在侧边栏「AI 厂商」页拉取一次模型完成授权',
    );
  }
  return {
    vendor,
    modelId,
    thinkingMode: preference.thinkingMode,
  };
};

// 生成下一条回复：优先用库中完整 JD，无记录时用输入兜底信息，带 HR 信息
const handleGenerateReply = async (input: ReplyInput): Promise<string> => {
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
  });
};

// 生成跟进消息：沟通暂时中断时，结合 JD、HR、简历与当前聊天记录
const handleFollowUp = async (input: FollowUpInput): Promise<string> => {
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
  });
};

// 生成打招呼语句：首次联系时，结合 JD 与 HR 信息
const handleGreeting = async (input: GreetingInput): Promise<string> => {
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
  });
};

// 生成请教反馈消息：优先用库中完整 JD，无记录时用输入兜底信息，带 HR 信息
const handleRejectionFeedback = async (
  input: RejectionFeedbackInput,
): Promise<string> => {
  const { vendor, modelId, thinkingMode } = await resolveGenerationContext();
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateRejectionFeedback({
    jd,
    messages: input.messages,
    vendor,
    modelId,
    thinkingMode,
    hr: input.hr,
    requestPermission: false,
  });
};

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
  onMessage('getPageDebugLogs', () => handlePageDebugLogs());
  onMessage('saveDebugSettings', async ({ data }) => {
    const parsed = debugSettingsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 调试设置参数不合法');
    }
    await debugSettingStore.saveDebugSettings(parsed.data);
    // 广播到各标签页，探测脚本即时注入/移除按钮
    await broadcastNotify('debug-settings-changed');
  });
  onMessage('greeting', ({ data }) => {
    const parsed = greetingInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('打招呼参数不合法');
    }
    return handleGreeting(parsed.data);
  });
  onMessage('followUp', ({ data }) => {
    const parsed = followUpInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('跟进参数不合法');
    }
    return handleFollowUp(parsed.data);
  });
  onMessage('generateReply', ({ data }) => {
    const parsed = replyInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('回复生成参数不合法');
    }
    return handleGenerateReply(parsed.data);
  });
  onMessage('rejectionFeedback', ({ data }) => {
    const parsed = rejectionFeedbackInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('请教反馈参数不合法');
    }
    return handleRejectionFeedback(parsed.data);
  });
});
