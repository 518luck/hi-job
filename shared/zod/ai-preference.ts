// # ai-preference 表数据字典：AI 调用的全局偏好（厂商/模型选择 + 思考模式）
import { z } from 'zod';

// 思考模式档位：default 不传任何参数，off 显式禁用思考，low/medium/high 递增强度
const THINKING_MODES = ['default', 'off', 'low', 'medium', 'high'] as const;

// 支持生成后投递的消息场景：键与聊天窗协议方法名对齐
const SCENE_DELIVERY_SCENES = [
  'generateReply',
  'followUp',
  'rejectionFeedback',
] as const;

// 单场景投递开关：生成完成后的填入与发送两档
const sceneDeliverySchema = z.object({
  fill: z.boolean(), // 生成完成后自动填入 Boss 聊天输入框
  send: z.boolean(), // 填入后自动点击发送，依赖 fill 开启
});

// 各场景投递开关表：键为协议方法名，值为该场景的填入/发送开关
const sceneDeliveryMapSchema = z.record(
  z.enum(SCENE_DELIVERY_SCENES),
  sceneDeliverySchema,
);

// 表 aiPreference（AI 调用偏好）落库实体：主键 key，单行
const aiPreferenceSchema = z.object({
  key: z.literal('global'), // 单行固定主键
  vendorId: z.string().nullable(), // 工作台选择的厂商 id，null 表示未选择
  modelId: z.string().nullable(), // 工作台选择的模型 id，null 表示未选择
  thinkingMode: z.enum(THINKING_MODES), // 思考模式档位
  autoGreetOnGoChat: z.boolean(), // 去沟通流程落到聊天页后自动发起 AI 问候生成
  autoSendGreeting: z.boolean(), // 问候生成完成后自动填入 Boss 输入框并发送（依赖上一项开启）
  sceneDelivery: sceneDeliveryMapSchema, // 各消息场景（回复/提醒/反馈）生成后的填入与发送开关
  greetingSystem: z.string().nullable(), // 打招呼系统提示文案，null 用默认
  greetingTask: z.string().nullable(), // 打招呼任务描述文案，null 用默认文案
  greetingRequirement: z.string().nullable(), // 打招呼生成要求文案，null 用默认文案
  followUpSystem: z.string().nullable(), // 跟进消息系统提示文案，null 用默认
  followUpTask: z.string().nullable(), // 跟进消息任务描述文案，null 用默认文案
  followUpRequirement: z.string().nullable(), // 跟进消息生成要求文案，null 用默认文案
  replySystem: z.string().nullable(), // 回复生成系统提示文案，null 用默认
  replyTask: z.string().nullable(), // 回复生成任务描述文案，null 用默认文案
  replyRequirement: z.string().nullable(), // 回复生成要求文案，null 用默认文案
  rejectionFeedbackSystem: z.string().nullable(), // 请教反馈系统提示文案，null 用默认
  rejectionFeedbackTask: z.string().nullable(), // 请教反馈任务描述文案，null 用默认文案
  rejectionFeedbackRequirement: z.string().nullable(), // 请教反馈生成要求文案，null 用默认文案
});

// 协议传输的偏好：去掉存储主键
const aiPreferenceInputSchema = aiPreferenceSchema.omit({ key: true });

// 从 schema 派生类型，保持单一事实来源
type AiPreference = z.infer<typeof aiPreferenceSchema>;
type AiPreferenceInput = z.infer<typeof aiPreferenceInputSchema>;
type ThinkingMode = z.infer<typeof aiPreferenceSchema>['thinkingMode'];
type SceneDelivery = z.infer<typeof sceneDeliverySchema>;
type SceneDeliveryMap = z.infer<typeof sceneDeliveryMapSchema>;
type DeliveryScene = (typeof SCENE_DELIVERY_SCENES)[number];

export type {
  AiPreference,
  AiPreferenceInput,
  DeliveryScene,
  SceneDelivery,
  SceneDeliveryMap,
  ThinkingMode,
};
export {
  aiPreferenceInputSchema,
  aiPreferenceSchema,
  SCENE_DELIVERY_SCENES,
  THINKING_MODES,
};
