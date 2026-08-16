// # 后台脚本：侧边栏行为 + 消息中枢（职位记录、HR 标记、AI 回复生成）
import { generateReply } from '@/infra/ai';
import { aiVendorStore, friendMarkStore, jdStore } from '@/infra/storage';
import type { GenerateReplyMessage, ReplyJd } from '@/shared/zod';
import {
  friendMarksResponseSchema,
  generateReplyMessageSchema,
  getFriendMarksMessageSchema,
  recordJdMessageSchema,
  saveFriendMarkMessageSchema,
} from '@/shared/zod';

// 生成下一条回复：优先用库中完整 JD，无记录时用聊天页兜底信息
const handleGenerateReply = async (
  message: GenerateReplyMessage,
): Promise<string> => {
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
  const recorded = await jdStore.readJdByJobId(message.jobId);
  const jd: ReplyJd = recorded ?? message.jd;
  return generateReply({
    jd,
    messages: message.messages,
    vendor,
    modelId,
    requestPermission: false,
  });
};

export default defineBackground(() => {
  // 点击工具栏图标直接打开侧边栏面板（Chrome 专属 API，Firefox 自动跳过）
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });

  // > 内容脚本消息中枢：职位记录落库、HR 标记读写、AI 回复生成（后两者返回 Promise 应答）
  browser.runtime.onMessage.addListener((message) => {
    const recordParsed = recordJdMessageSchema.safeParse(message);
    if (recordParsed.success) {
      jdStore.saveSelectedJd({ jd: recordParsed.data.jd });
      return;
    }
    const saveMarkParsed = saveFriendMarkMessageSchema.safeParse(message);
    if (saveMarkParsed.success) {
      void friendMarkStore.saveFriendMark(saveMarkParsed.data);
      return;
    }
    const getMarksParsed = getFriendMarksMessageSchema.safeParse(message);
    if (getMarksParsed.success) {
      return friendMarkStore
        .readAllFriendMarks()
        .then((marks) => friendMarksResponseSchema.parse(marks));
    }
    const replyParsed = generateReplyMessageSchema.safeParse(message);
    if (replyParsed.success) {
      return handleGenerateReply(replyParsed.data);
    }
  });
});
