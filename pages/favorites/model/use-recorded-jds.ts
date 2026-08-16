import { useLiveQuery } from 'dexie-react-hooks';

import type { CompanyRecord, RecordedJd } from '@/shared/infra/storage';
import { jdStore } from '@/shared/infra/storage';

// 收藏页列表数据：数据库变化时自动重新查询
const useRecordedJds = (): {
  jds: RecordedJd[];
  companies: CompanyRecord[];
  loading: boolean;
} => {
  const jdsQuery = useLiveQuery(() => jdStore.readAllRecordedJds(), []);
  const companiesQuery = useLiveQuery(
    () => jdStore.readAllCompanyRecords(),
    [],
  );

  return {
    jds: jdsQuery ?? [],
    companies: companiesQuery ?? [],
    loading: jdsQuery === undefined || companiesQuery === undefined,
  };
};

export { useRecordedJds };
