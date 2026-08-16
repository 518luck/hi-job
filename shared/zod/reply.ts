// # reply 消息数据字典：聊天页请求 AI 生成下一条回复的数据结构
import { z } from 'zod';

import { hrInfoSchema } from './chat-session';

// 单条聊天记录：说话方与正文
const replyMessageSchema = z.object({
  role: z.enum(['friend', 'self']), // friend 招聘者 / self 求职者
  text: z.string(), // 消息正文
});

// 回复生成所需的最小职位信息：来自扩展库 JD 或聊天页兜底
const replyJdSchema = z.object({
  title: z.string(), // 职位名称
  companyName: z.string(), // 公司名
  companyScale: z.string(), // 公司规模，读不到为空串
  companyIndustry: z.string(), // 公司行业，读不到为空串
  salary: z.string(), // 薪资文本，读不到为空串
  description: z.string(), // 职位描述，读不到为空串
});

// 生成请求的输入数据：后台优先按 jobId 查库拿完整 JD
const replyInputSchema = z.object({
  jobId: z.string(), // 职位 id（encryptJobId），后台优先查库
  jd: replyJdSchema, // 职位信息兜底，库中无记录时使用
  messages: z.array(replyMessageSchema), // 聊天记录，按时间正序
  hr: hrInfoSchema.optional(), // 当前会话的 HR 信息，读不到时缺省
});

// 从 schema 派生类型，保持单一事实来源
type ReplyInput = z.infer<typeof replyInputSchema>;
type ReplyJd = z.infer<typeof replyJdSchema>;
type ReplyMessage = z.infer<typeof replyMessageSchema>;

export type { ReplyInput, ReplyJd, ReplyMessage };
export { replyInputSchema, replyJdSchema, replyMessageSchema };
