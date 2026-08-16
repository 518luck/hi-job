import { useLiveQuery } from 'dexie-react-hooks';

import {
  DEFAULT_THINKING_MODE,
  thinkingModeStore,
} from '@/shared/infra/storage';
import type { ThinkingMode } from '@/shared/zod';

// 工作台思考模式：实时读取存储，切换即保存，打招呼与聊天页回复生成共用
const useThinkingMode = (): {
  mode: ThinkingMode;
  setMode: (mode: ThinkingMode) => Promise<void>;
} => {
  const mode = useLiveQuery(
    () => thinkingModeStore.readThinkingMode(),
    [],
    DEFAULT_THINKING_MODE,
  );

  const setMode = async (next: ThinkingMode): Promise<void> => {
    await thinkingModeStore.saveThinkingMode(next);
  };

  return { mode, setMode };
};

export { useThinkingMode };
