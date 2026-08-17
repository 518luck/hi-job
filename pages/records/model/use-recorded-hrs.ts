import { useLiveQuery } from 'dexie-react-hooks';

import { hrStore } from '@/shared/infra/storage';
import type { Hr } from '@/shared/zod';

// 记录页 HR 列表数据：数据库变化时自动重新查询
const useRecordedHrs = (): {
  hrs: Hr[];
  loading: boolean;
} => {
  const hrsQuery = useLiveQuery(() => hrStore.readAllHrs(), []);

  return {
    hrs: hrsQuery ?? [],
    loading: hrsQuery === undefined,
  };
};

export { useRecordedHrs };
