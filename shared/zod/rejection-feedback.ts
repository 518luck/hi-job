// # rejection-feedback 消息：请求 AI 生成招聘流程结束后的反馈请教消息
import { z } from 'zod';

import { hrInfoSchema } from './hr';
import { replyJdSchema, replyMessageSchema } from './reply';

// 请教反馈输入：会话职位 + 最近聊天记录 + 兜底职位信息 + 可选 HR 信息
const rejectionFeedbackInputSchema = z.object({
  jobId: z.string(), // 会话关联职位 id（BOSS 加密 id）
  jd: replyJdSchema, // 兜底职位信息，未记录时用
  messages: z.array(replyMessageSchema), // 最近聊天记录，按时间正序
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
});

// 从 schema 派生类型，保持单一事实来源
type RejectionFeedbackInput = z.infer<typeof rejectionFeedbackInputSchema>;

export type { RejectionFeedbackInput };
export { rejectionFeedbackInputSchema };
