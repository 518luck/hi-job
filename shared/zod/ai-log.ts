// # ai-log 表数据字典：AI 调用日志（调试用）
import { z } from 'zod';

import { THINKING_MODES } from './ai-preference';

// 表 aiLog（AI 调用日志）落库实体：主键 id 自增
const aiLogSchema = z.object({
  id: z.number().optional(), // Dexie 自增主键，写入时自动生成
  createdAt: z.number(), // 调用结束时间戳（毫秒）
  source: z.enum(['greeting', 'reply', 'followUp']), // 调用来源：打招呼/聊天页回复/提醒问候
  vendorName: z.string(), // 厂商名称
  apiFormat: z.enum(['openai', 'anthropic']), // API 协议格式
  modelId: z.string(), // 模型 id
  thinkingMode: z.enum(THINKING_MODES), // 本次调用的思考模式档位
  resolvedArgs: z.unknown(), // 实际传递给 AI SDK 的思考参数
  system: z.string().optional(), // 系统提示（角色设定），完整记录
  prompt: z.string().optional(), // 用户提示（本次任务内容），完整记录
  promptTask: z.string().optional(), // 提示词任务描述（打招呼生成时记录），旧记录缺省
  promptRequirement: z.string().optional(), // 提示词生成要求（打招呼生成时记录），旧记录缺省
  resume: z.string().optional(), // 用户简历文本，未上传时为空串
  ok: z.boolean(), // 调用是否成功
  durationMs: z.number(), // 调用耗时（毫秒）
  output: z.string().optional(), // 成功时的返回文本，失败时缺省
  error: z.string().optional(), // 失败时的错误消息
});

// 日志写入输入：去掉自增主键，由仓储生成
const aiLogInputSchema = aiLogSchema.omit({ id: true });

// 从 schema 派生类型，保持单一事实来源
type AiLog = z.infer<typeof aiLogSchema>;
type AiLogInput = z.infer<typeof aiLogInputSchema>;
type AiLogSource = z.infer<typeof aiLogSchema>['source'];

export type { AiLog, AiLogInput, AiLogSource };
export { aiLogInputSchema, aiLogSchema };
