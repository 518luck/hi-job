// # chat-session 表数据字典：聊天页当前会话的 HR 档案
import { z } from 'zod';

// 表 chatSession（聊天会话档案）落库实体：主键 encryptBossId
const chatSessionSchema = z.object({
  encryptBossId: z.string(), // HR 会话唯一 id（BOSS 加密 id）
  encryptJobId: z.string(), // 会话关联职位的唯一 id
  bossName: z.string(), // 招聘者姓名
  bossTitle: z.string(), // 招聘者头衔（如 HR、招聘经理）
  brandName: z.string(), // 公司名称
  lastText: z.string(), // 会话最后一条消息文本
  lastMsgAt: z.number(), // 最后一条消息时间戳（毫秒），读不到为 0
  lastIsSelf: z.boolean(), // 最后一条消息是否为自己发出，false 表示 HR 发的最后一条
  lastChatAt: z.number(), // 最近一次打开该会话的时间戳（毫秒），后台落库时盖章
});

// 上报输入：内容脚本从聊天页读取的会话信息，lastChatAt 由后台补齐
const chatSessionInputSchema = chatSessionSchema.omit({ lastChatAt: true });

// 从 schema 派生类型，保持单一事实来源
type ChatSession = z.infer<typeof chatSessionSchema>;
type ChatSessionInput = z.infer<typeof chatSessionInputSchema>;

export type { ChatSession, ChatSessionInput };
export { chatSessionInputSchema, chatSessionSchema };
