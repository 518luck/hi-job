// # follow-up 消息：聊天页请求 AI 生成提醒问候（已读不回/未读场景）
import { z } from 'zod';

import { hrInfoSchema } from './hr';
import { replyJdSchema } from './reply';

// 跟进问候的输入：会话职位 + 已发送的打招呼语句 + 兜底职位信息 + 可选 HR 信息
const followUpInputSchema = z.object({
  jobId: z.string(), // 会话关联职位 id（BOSS 加密 id）
  jd: replyJdSchema, // 兜底职位信息，未记录时用
  greeting: z.string(), // 已发送的打招呼语句
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
});

// 从 schema 派生类型，保持单一事实来源
type FollowUpInput = z.infer<typeof followUpInputSchema>;

export type { FollowUpInput };
export { followUpInputSchema };
