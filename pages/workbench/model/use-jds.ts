import { useLiveQuery } from 'dexie-react-hooks';

import type { RecordedJd } from '@/shared/infra/storage';
import { jdStore } from '@/shared/infra/storage';

// 职位页列表数据：数据库变化时自动重新查询
const useJds = (): { jds: RecordedJd[]; loading: boolean } => {
  const query = useLiveQuery(() => jdStore.readAllRecordedJds(), []);

  return {
    jds: query ?? [],
    loading: query === undefined,
  };
};

export { useJds };
