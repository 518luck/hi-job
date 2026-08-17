import { useCallback, useEffect, useState } from 'react';

import type { OriginUsage } from '@/shared/infra/storage';
import { storageUsageStore } from '@/shared/infra/storage';

// 设置页存储占用：挂载与刷新时读取扩展源存储估算
const useStorageUsage = (): {
  origin?: OriginUsage;
  refresh: () => Promise<void>;
} => {
  const [origin, setOrigin] = useState<OriginUsage>();

  const refresh = useCallback(async (): Promise<void> => {
    setOrigin(await storageUsageStore.readOriginUsage().catch(() => undefined));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { origin, refresh };
};

export { useStorageUsage };
