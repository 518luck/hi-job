import { useLiveQuery } from 'dexie-react-hooks';

import {
  aiPreferenceStore,
  DEFAULT_AI_PREFERENCE,
} from '@/shared/infra/storage';
import type {
  DeliveryScene,
  SceneDelivery,
  SceneDeliveryMap,
  ThinkingMode,
} from '@/shared/zod';

// 工作台全局 AI 偏好：厂商/模型选择与思考模式，选择即持久化，聊天页回复与打招呼共用
const useAiPreference = (): {
  vendorId: string | null;
  modelId: string | null;
  thinkingMode: ThinkingMode;
  autoGreetOnGoChat: boolean;
  autoSendGreeting: boolean;
  sceneDelivery: SceneDeliveryMap;
  selectVendor: (vendorId: string | null) => void;
  selectModel: (modelId: string | null) => void;
  setThinkingMode: (mode: ThinkingMode) => Promise<void>;
  setAutoGreetOnGoChat: (enabled: boolean) => void;
  setAutoSendGreeting: (enabled: boolean) => void;
  updateSceneDelivery: (
    scene: DeliveryScene,
    patch: Partial<SceneDelivery>,
  ) => void;
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

  // 切换去沟通自动问候：更新状态并持久化
  const setAutoGreetOnGoChat = (enabled: boolean): void => {
    void aiPreferenceStore.saveAiPreference({
      ...preference,
      autoGreetOnGoChat: enabled,
    });
  };

  // 切换问候自动发送：更新状态并持久化
  const setAutoSendGreeting = (enabled: boolean): void => {
    void aiPreferenceStore.saveAiPreference({
      ...preference,
      autoSendGreeting: enabled,
    });
  };

  // 更新某场景的投递开关：合并写入该场景的填入/发送配置
  const updateSceneDelivery = (
    scene: DeliveryScene,
    patch: Partial<SceneDelivery>,
  ): void => {
    void aiPreferenceStore.saveAiPreference({
      ...preference,
      sceneDelivery: {
        ...preference.sceneDelivery,
        [scene]: { ...preference.sceneDelivery[scene], ...patch },
      },
    });
  };

  return {
    vendorId: preference.vendorId,
    modelId: preference.modelId,
    thinkingMode: preference.thinkingMode,
    autoGreetOnGoChat: preference.autoGreetOnGoChat,
    autoSendGreeting: preference.autoSendGreeting,
    sceneDelivery: preference.sceneDelivery,
    selectVendor,
    selectModel,
    setThinkingMode,
    setAutoGreetOnGoChat,
    setAutoSendGreeting,
    updateSceneDelivery,
  };
};

export { useAiPreference };
