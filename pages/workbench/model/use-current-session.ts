import { useLiveQuery } from 'dexie-react-hooks';

import { hrStore, jdStore } from '@/shared/infra/storage';
import type { Hr, RecordedJd } from '@/shared/zod';

// 当前会话聚合结果：最近打开的 HR 与关联职位
interface CurrentSessionView {
  hr: Hr; // 最近打开的 HR 档案
  jd?: RecordedJd; // 关联职位，未抓取时缺省
}

// 工作台当前会话：最近打开 HR + 关联职位，数据库变化自动刷新
const useCurrentSession = (): { view?: CurrentSessionView } => {
  const view = useLiveQuery(async (): Promise<
    CurrentSessionView | undefined
  > => {
    const hr = await hrStore.readLatestHr();
    if (hr === undefined) {
      return undefined;
    }
    const jd = await jdStore.readJdByJobId(hr.encryptJobId);
    return { hr, jd };
  }, []);

  return { view };
};

export { useCurrentSession };
