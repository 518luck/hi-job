// # 后台脚本：侧边栏行为 + 消息中枢（职位记录、HR 标记、调试开关、AI 回复生成）
import { generateReply } from '@/shared/infra/ai';
import { onMessage } from '@/shared/infra/messaging';
import {
  aiPreferenceStore,
  aiVendorStore,
  chatSessionStore,
  debugSettingStore,
  friendMarkStore,
  jdStore,
} from '@/shared/infra/storage';
import type { ReplyInput } from '@/shared/zod';
import {
  chatSessionInputSchema,
  debugSettingsSchema,
  friendMarkInputSchema,
  friendMarksResponseSchema,
  replyInputSchema,
  selectedJdSchema,
} from '@/shared/zod';

// 生成下一条回复：优先用库中完整 JD，无记录时用输入兜底信息，按全局偏好（厂商/模型/思考模式）生成
const handleGenerateReply = async (input: ReplyInput): Promise<string> => {
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
  const recorded = await jdStore.readJdByJobId(input.jobId);
  const jd = recorded ?? input.jd;
  return generateReply({
    jd,
    messages: input.messages,
    vendor,
    modelId,
    thinkingMode: preference.thinkingMode,
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
  onMessage('saveFriendMark', async ({ data }) => {
    const parsed = friendMarkInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: HR 标记参数不合法');
    }
    await friendMarkStore.saveFriendMark(parsed.data);
  });
  onMessage('getFriendMarks', () =>
    friendMarkStore
      .readAllFriendMarks()
      .then((marks) => friendMarksResponseSchema.parse(marks)),
  );
  onMessage('saveChatSession', async ({ data }) => {
    const parsed = chatSessionInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 会话上报参数不合法');
    }
    await chatSessionStore.saveChatSession(parsed.data);
  });
  onMessage('marksChanged', () => broadcastNotify('marks-changed'));
  onMessage('getDebugSettings', () => debugSettingStore.readDebugSettings());
  onMessage('saveDebugSettings', async ({ data }) => {
    const parsed = debugSettingsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('INVALID_PARAMS: 调试设置参数不合法');
    }
    await debugSettingStore.saveDebugSettings(parsed.data);
    // 广播到各标签页，探测脚本即时注入/移除按钮
    await broadcastNotify('debug-settings-changed');
  });
  onMessage('generateReply', ({ data }) => {
    const parsed = replyInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('回复生成参数不合法');
    }
    return handleGenerateReply(parsed.data);
  });
});
