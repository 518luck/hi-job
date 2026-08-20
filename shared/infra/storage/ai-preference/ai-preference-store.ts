// # ai-preference 领域仓储：AI 调用全局偏好的统一读写入口
import type {
  AiPreferenceInput,
  SceneDelivery,
  SceneDeliveryMap,
} from '@/shared/zod';

import { db } from '../db';

// 单行固定主键：AI 调用偏好只有一份
const AI_PREFERENCE_KEY = 'global';

// 各消息场景投递开关默认值：三场景默认都不自动投递
const DEFAULT_SCENE_DELIVERY: SceneDeliveryMap = {
  generateReply: { fill: false, send: false }, // 回复：生成后填入/发送开关
  followUp: { fill: false, send: false }, // 提醒：生成后填入/发送开关
  rejectionFeedback: { fill: false, send: false }, // 反馈：生成后填入/发送开关
};

// 默认偏好：未选择厂商/模型，思考模式默认档，各场景系统提示与文案用默认
const DEFAULT_AI_PREFERENCE: AiPreferenceInput = {
  vendorId: null, // 工作台所选厂商 id，null 未选择
  modelId: null, // 工作台所选模型 id，null 未选择
  thinkingMode: 'default', // 思考模式档位
  autoGreetOnGoChat: true, // 去沟通流程落到聊天页后自动发起 AI 问候生成（默认开启）
  autoSendGreeting: false, // 问候生成完成后自动填入 Boss 输入框并发送
  sceneDelivery: DEFAULT_SCENE_DELIVERY, // 各消息场景生成后的填入/发送开关
  greetingSystem: null, // 打招呼系统提示，null 用默认
  greetingTask: null, // 打招呼任务描述，null 用默认
  greetingRequirement: null, // 打招呼生成要求，null 用默认
  followUpSystem: null, // 跟进系统提示，null 用默认
  followUpTask: null, // 跟进任务描述，null 用默认
  followUpRequirement: null, // 跟进生成要求，null 用默认
  replySystem: null, // 回复系统提示，null 用默认
  replyTask: null, // 回复任务描述，null 用默认
  replyRequirement: null, // 回复生成要求，null 用默认
  rejectionFeedbackSystem: null, // 请教反馈系统提示，null 用默认
  rejectionFeedbackTask: null, // 请教反馈任务描述，null 用默认
  rejectionFeedbackRequirement: null, // 请教反馈生成要求，null 用默认
};

// 保存偏好：单行覆盖写入
const saveAiPreference = async (
  preference: AiPreferenceInput,
): Promise<void> => {
  await db.aiPreference.put({ key: AI_PREFERENCE_KEY, ...preference });
};

// 单场景投递值兜底：场景值本身缺失或缺字段时逐项回 false，保证读出形状与类型严格一致
const deliveryOf = (value: SceneDelivery | undefined): SceneDelivery => ({
  fill: value?.fill ?? false,
  send: value?.send ?? false,
});

// 读取偏好：无记录时返回默认偏好
const readAiPreference = async (): Promise<AiPreferenceInput> => {
  const record = await db.aiPreference.get(AI_PREFERENCE_KEY);
  if (record === undefined) {
    return DEFAULT_AI_PREFERENCE;
  }
  // 旧记录可能整字段缺 sceneDelivery，先回空表再逐键兜底
  const sceneDelivery = record.sceneDelivery ?? {};
  // 去掉存储主键，只返回偏好字段；旧记录缺字段时按 null（用默认文案）处理
  return {
    vendorId: record.vendorId,
    modelId: record.modelId,
    thinkingMode: record.thinkingMode,
    autoGreetOnGoChat: record.autoGreetOnGoChat ?? true, // 旧记录缺字段时按默认开启兜底
    autoSendGreeting: record.autoSendGreeting ?? false,
    sceneDelivery: {
      generateReply: deliveryOf(sceneDelivery.generateReply), // 回复：填入/发送开关
      followUp: deliveryOf(sceneDelivery.followUp), // 提醒：填入/发送开关
      rejectionFeedback: deliveryOf(sceneDelivery.rejectionFeedback), // 反馈：填入/发送开关
    },
    greetingSystem: record.greetingSystem ?? null,
    greetingTask: record.greetingTask ?? null,
    greetingRequirement: record.greetingRequirement ?? null,
    followUpSystem: record.followUpSystem ?? null,
    followUpTask: record.followUpTask ?? null,
    followUpRequirement: record.followUpRequirement ?? null,
    replySystem: record.replySystem ?? null,
    replyTask: record.replyTask ?? null,
    replyRequirement: record.replyRequirement ?? null,
    rejectionFeedbackSystem: record.rejectionFeedbackSystem ?? null,
    rejectionFeedbackTask: record.rejectionFeedbackTask ?? null,
    rejectionFeedbackRequirement: record.rejectionFeedbackRequirement ?? null,
  };
};

// ai-preference 领域仓储：AI 调用全局偏好的统一读写入口
const aiPreferenceStore = {
  saveAiPreference, // 保存偏好（厂商/模型/思考模式/提示词）
  readAiPreference, // 读取偏好（无记录时默认值）
};

export { aiPreferenceStore, DEFAULT_AI_PREFERENCE };
