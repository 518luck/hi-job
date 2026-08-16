import { useLiveQuery } from 'dexie-react-hooks';

import {
  aiPreferenceStore,
  DEFAULT_AI_PREFERENCE,
} from '@/shared/infra/storage';
import type { ThinkingMode } from '@/shared/zod';

// 工作台全局 AI 偏好：厂商/模型选择与思考模式，选择即持久化，聊天页回复与打招呼共用
const useAiPreference = (): {
  vendorId: string | null;
  modelId: string | null;
  thinkingMode: ThinkingMode;
  selectVendor: (vendorId: string | null) => void;
  selectModel: (modelId: string | null) => void;
  setThinkingMode: (mode: ThinkingMode) => Promise<void>;
} => {
  const preference = useLiveQuery(
    () => aiPreferenceStore.readAiPreference(),
    [],
    DEFAULT_AI_PREFERENCE,
  );

  // 切换厂商：清空模型选择，由页面回退逻辑自动选中该厂商第一个模型
  const selectVendor = (next: string | null): void => {
    void aiPreferenceStore.saveAiPreference({
      ...preference,
      vendorId: next,
      modelId: null,
    });
  };

  // 选择模型：更新状态并持久化
  const selectModel = (next: string | null): void => {
    void aiPreferenceStore.saveAiPreference({
      ...preference,
      modelId: next,
    });
  };

  // 切换思考模式：更新状态并持久化
  const setThinkingMode = async (next: ThinkingMode): Promise<void> => {
    await aiPreferenceStore.saveAiPreference({
      ...preference,
      thinkingMode: next,
    });
  };

  return {
    vendorId: preference.vendorId,
    modelId: preference.modelId,
    thinkingMode: preference.thinkingMode,
    selectVendor,
    selectModel,
    setThinkingMode,
  };
};

export { useAiPreference };
