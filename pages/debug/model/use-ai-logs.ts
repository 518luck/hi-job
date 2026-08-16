import { useLiveQuery } from 'dexie-react-hooks';

import { aiLogStore } from '@/shared/infra/storage';
import type { AiLog } from '@/shared/zod';

// 调试页 AI 日志：实时读取最新日志，清空操作直连仓储
const useAiLogs = (): {
  logs: AiLog[];
  clear: () => Promise<void>;
} => {
  const logs = useLiveQuery(() => aiLogStore.listAiLogs(), [], []);

  const clear = async (): Promise<void> => {
    await aiLogStore.clearAiLogs();
  };

  return { logs, clear };
};

export { useAiLogs };
