// # 后台脚本：侧边栏行为 + 消息中枢（职位记录、HR 标记、AI 回复生成）
import { generateReply } from '@/shared/infra/ai';
import { onMessage } from '@/shared/infra/messaging';
import {
  aiVendorStore,
  chatSessionStore,
  friendMarkStore,
  jdStore,
} from '@/shared/infra/storage';
import type { ReplyInput } from '@/shared/zod';
import {
  chatSessionInputSchema,
  friendMarkInputSchema,
  friendMarksResponseSchema,
  replyInputSchema,
  selectedJdSchema,
} from '@/shared/zod';

// 生成下一条回复：优先用库中完整 JD，无记录时用输入兜底信息
const handleGenerateReply = async (input: ReplyInput): Promise<string> => {
  const vendors = await aiVendorStore.readAllVendors();
  const vendor = vendors[0];
  const modelId = vendor?.models[0];
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
    requestPermission: false,
  });
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
  onMessage('generateReply', ({ data }) => {
    const parsed = replyInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('回复生成参数不合法');
    }
    return handleGenerateReply(parsed.data);
  });
});
