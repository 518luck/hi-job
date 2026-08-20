// # ai-log 表数据字典：AI 调用日志（调试用）——直接存储上游原生的调用素材
import { z } from 'zod';

import { THINKING_MODES } from './ai-preference';
import { hrInfoSchema } from './hr';
import { replyJdSchema } from './reply';

// 场景提示词结构：一次 AI 调用的原生素材，与「场景拼素材」时的形状一致，日志按原样存储
const scenePromptSchema = z.object({
  task: z.string(), // 提示词任务描述
  requirement: z.string(), // 提示词生成要求
  jd: replyJdSchema.optional(), // 目标职位信息，简历梳理等无职位场景缺省
  hr: hrInfoSchema.optional(), // HR 信息，无则缺省
  resumeText: z.string().optional(), // 求职者简历文本，未上传缺省
  sections: z.array(z.string()).optional(), // 场景差异段（聊天记录/打招呼语）
});

// 表 aiLog（AI 调用日志）落库实体：主键 id 自增
const aiLogSchema = z.object({
  id: z.number().optional(), // Dexie 自增主键，写入时自动生成
  createdAt: z.number(), // 调用结束时间戳（毫秒）
  source: z.enum([
    'greeting',
    'reply',
    'followUp',
    'rejectionFeedback',
    'resumeOrganize',
  ]), // 调用来源：问候/回复/提醒/反馈/简历（枚举顺序与各界面标签顺序共用）
  vendorName: z.string(), // 厂商名称
  apiFormat: z.enum(['openai', 'anthropic']), // API 协议格式
  modelId: z.string(), // 模型 id
  thinkingMode: z.enum(THINKING_MODES), // 本次调用的思考模式档位
  resolvedArgs: z.unknown(), // 实际传递给 AI SDK 的思考参数
  system: z.string().optional(), // 系统提示（角色设定），完整记录
  prompt: scenePromptSchema, // 原生结构化的用户提示素材，不再拼平
  promptText: z.string().optional(), // 拼平后的完整提示词文本（实际发送给模型的内容）
  ok: z.boolean(), // 调用是否成功
  durationMs: z.number(), // 调用耗时（毫秒）
  inputTokens: z.number().optional(), // 输入 token 数，SDK 未返回时缺省（旧日志无此字段）
  outputTokens: z.number().optional(), // 输出 token 数，SDK 未返回时缺省（旧日志无此字段）
  output: z.string().optional(), // 成功时的返回文本，失败时缺省
  error: z.string().optional(), // 失败时的错误消息
});

// 日志写入输入：去掉自增主键，由仓储生成
const aiLogInputSchema = aiLogSchema.omit({ id: true });

// 从 schema 派生类型，保持单一事实来源
type AiLog = z.infer<typeof aiLogSchema>;
type AiLogInput = z.infer<typeof aiLogInputSchema>;
type AiLogSource = z.infer<typeof aiLogSchema>['source'];
type ScenePrompt = z.infer<typeof scenePromptSchema>;

export type { AiLog, AiLogInput, AiLogSource, ScenePrompt };
export { aiLogInputSchema, aiLogSchema, scenePromptSchema };
