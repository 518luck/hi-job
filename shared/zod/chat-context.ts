// # chat-context 消息：聊天页当前会话上下文（隔离世界聊天 UI 经 Window RPC 读取）
import { z } from 'zod';

import { hrInfoSchema } from './hr';
import { replyJdSchema, replyMessageSchema } from './reply';

// 聊天页当前会话上下文：主世界读 Vue/DOM 汇总，供 AI 生成各场景取材
const chatContextSchema = z.object({
  jobId: z.string(), // 当前会话职位 id（encryptJobId）
  jd: replyJdSchema, // 由会话信息拼出的最小职位信息
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
  messages: z.array(replyMessageSchema), // 聊天记录（最近 100 条，按时间正序）
});

type ChatContext = z.infer<typeof chatContextSchema>;

export type { ChatContext };
export { chatContextSchema };
