// # ai-preference 领域仓储：AI 调用全局偏好的统一读写入口
import type { AiPreferenceInput } from '@/shared/zod';

import { db } from '../db';

// 单行固定主键：AI 调用偏好只有一份
const AI_PREFERENCE_KEY = 'global';

// 默认偏好：未选择厂商/模型，思考模式默认档
const DEFAULT_AI_PREFERENCE: AiPreferenceInput = {
  vendorId: null,
  modelId: null,
  thinkingMode: 'default',
};

// 保存偏好：单行覆盖写入
const saveAiPreference = async (
  preference: AiPreferenceInput,
): Promise<void> => {
  await db.aiPreference.put({ key: AI_PREFERENCE_KEY, ...preference });
};

// 读取偏好：无记录时返回默认偏好
const readAiPreference = async (): Promise<AiPreferenceInput> => {
  const record = await db.aiPreference.get(AI_PREFERENCE_KEY);
  if (record === undefined) {
    return DEFAULT_AI_PREFERENCE;
  }
  // 去掉存储主键，只返回偏好字段
  return {
    vendorId: record.vendorId,
    modelId: record.modelId,
    thinkingMode: record.thinkingMode,
  };
};

// ai-preference 领域仓储：AI 调用全局偏好的统一读写入口
const aiPreferenceStore = {
  saveAiPreference, // 保存偏好（厂商/模型/思考模式）
  readAiPreference, // 读取偏好（无记录时默认值）
};

export { aiPreferenceStore, DEFAULT_AI_PREFERENCE };
