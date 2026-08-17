// # follow-up 消息：聊天页请求 AI 生成中断沟通的跟进消息
import { z } from 'zod';

import { hrInfoSchema } from './hr';
import { replyJdSchema, replyMessageSchema } from './reply';

// 跟进消息的输入：会话职位、当前聊天记录、兜底职位信息与可选 HR 信息
const followUpInputSchema = z.object({
  jobId: z.string(), // 会话关联职位 id（BOSS 加密 id）
  jd: replyJdSchema, // 兜底职位信息，未记录时用
  messages: z
    .array(replyMessageSchema)
    .min(1)
    .refine((messages) => messages.at(-1)?.role === 'self'), // 当前页面最近聊天记录，末条必须来自求职者
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
});

// 从 schema 派生类型，保持单一事实来源
type FollowUpInput = z.infer<typeof followUpInputSchema>;

export type { FollowUpInput };
export { followUpInputSchema };
