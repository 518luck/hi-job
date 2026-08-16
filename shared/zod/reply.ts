// # reply 消息数据字典：聊天页请求 AI 生成下一条回复的消息信封
import { z } from 'zod';

// 聊天页向后台请求生成回复的消息类型
const GENERATE_REPLY = 'hi-job:generate-reply';

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

// 消息信封：聊天页发来的生成请求
const generateReplyMessageSchema = z.object({
  type: z.literal(GENERATE_REPLY), // 消息类型标识
  jobId: z.string(), // 职位 id（encryptJobId），后台优先查库拿完整 JD
  jd: replyJdSchema, // 职位信息兜底，库中无记录时使用
  messages: z.array(replyMessageSchema), // 聊天记录，按时间正序
});

// 从 schema 派生类型，保持单一事实来源
type GenerateReplyMessage = z.infer<typeof generateReplyMessageSchema>;
type ReplyJd = z.infer<typeof replyJdSchema>;
type ReplyMessage = z.infer<typeof replyMessageSchema>;

export type { GenerateReplyMessage, ReplyJd, ReplyMessage };
export {
  GENERATE_REPLY,
  generateReplyMessageSchema,
  replyJdSchema,
  replyMessageSchema,
};
