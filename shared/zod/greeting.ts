// # greeting 消息：聊天页请求 AI 生成打招呼语句（首次联系场景）
import { z } from 'zod';

import { hrInfoSchema } from './chat-session';
import { replyJdSchema } from './reply';

// 打招呼的输入：会话职位 + 兜底职位信息 + 可选 HR 信息
const greetingInputSchema = z.object({
  jobId: z.string(), // 会话关联职位 id（BOSS 加密 id）
  jd: replyJdSchema, // 兜底职位信息，未记录时用
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
});

// 从 schema 派生类型，保持单一事实来源
type GreetingInput = z.infer<typeof greetingInputSchema>;

export type { GreetingInput };
export { greetingInputSchema };
