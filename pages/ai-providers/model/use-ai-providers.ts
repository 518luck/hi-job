import { useLiveQuery } from 'dexie-react-hooks';

import { aiProviderStore } from '@/infra/storage';

// AI 厂商列表数据：数据库变化时自动重新查询
const useAiProviders = (): {
  providers: Awaited<ReturnType<typeof aiProviderStore.readAllAiProviders>>;
  loading: boolean;
} => {
  const query = useLiveQuery(() => aiProviderStore.readAllAiProviders(), []);

  return {
    providers: query ?? [],
    loading: query === undefined,
  };
};

export { useAiProviders };
