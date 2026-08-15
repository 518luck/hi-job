import { useLiveQuery } from 'dexie-react-hooks';

import { aiVendorStore } from '@/infra/storage';

// AI 厂商列表数据：数据库变化时自动重新查询
const useAiVendors = (): {
  vendors: Awaited<ReturnType<typeof aiVendorStore.readAllVendors>>;
  loading: boolean;
} => {
  const query = useLiveQuery(() => aiVendorStore.readAllVendors(), []);

  return {
    vendors: query ?? [],
    loading: query === undefined,
  };
};

export { useAiVendors };
