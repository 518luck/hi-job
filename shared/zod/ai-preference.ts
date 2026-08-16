// # ai-preference 表数据字典：AI 调用的全局偏好（厂商/模型选择 + 思考模式）
import { z } from 'zod';

// 思考模式档位：default 不传任何参数，off 显式禁用思考，low/medium/high 递增强度
const THINKING_MODES = ['default', 'off', 'low', 'medium', 'high'] as const;

// 表 aiPreference（AI 调用偏好）落库实体：主键 key，单行
const aiPreferenceSchema = z.object({
  key: z.literal('global'), // 单行固定主键
  vendorId: z.string().nullable(), // 工作台选择的厂商 id，null 表示未选择
  modelId: z.string().nullable(), // 工作台选择的模型 id，null 表示未选择
  thinkingMode: z.enum(THINKING_MODES), // 思考模式档位
  greetingSystem: z.string().nullable(), // 打招呼系统提示文案，null 用默认
  greetingTask: z.string().nullable(), // 打招呼任务描述文案，null 用默认文案
  greetingRequirement: z.string().nullable(), // 打招呼生成要求文案，null 用默认文案
  followUpSystem: z.string().nullable(), // 跟进问候系统提示文案，null 用默认
  followUpTask: z.string().nullable(), // 跟进问候任务描述文案，null 用默认文案
  followUpRequirement: z.string().nullable(), // 跟进问候生成要求文案，null 用默认文案
  replySystem: z.string().nullable(), // 回复生成系统提示文案，null 用默认
  replyTask: z.string().nullable(), // 回复生成任务描述文案，null 用默认文案
  replyRequirement: z.string().nullable(), // 回复生成要求文案，null 用默认文案
});

// 协议传输的偏好：去掉存储主键
const aiPreferenceInputSchema = aiPreferenceSchema.omit({ key: true });

// 从 schema 派生类型，保持单一事实来源
type AiPreference = z.infer<typeof aiPreferenceSchema>;
type AiPreferenceInput = z.infer<typeof aiPreferenceInputSchema>;
type ThinkingMode = z.infer<typeof aiPreferenceSchema>['thinkingMode'];

export type { AiPreference, AiPreferenceInput, ThinkingMode };
export { aiPreferenceInputSchema, aiPreferenceSchema, THINKING_MODES };
