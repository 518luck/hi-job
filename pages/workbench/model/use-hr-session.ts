import { useLiveQuery } from 'dexie-react-hooks';

import { sendMessage } from '@/shared/infra/messaging';
import { hrStore, jdStore } from '@/shared/infra/storage';
import type { Hr, RecordedJd } from '@/shared/zod';

// 当前 HR 档案聚合结果：档案 + 关联职位 + 排除标记
interface HrView {
  hr: Hr; // 最近打开的 HR 档案
  jd?: RecordedJd; // 会话职位对应的已记录职位，未记录时缺省
  excluded: boolean; // 是否已排除
}

// 工作台当前 HR：最近打开档案 + 关联职位 + 排除状态，数据库变化自动刷新
const useHrSession = (): {
  view?: HrView;
  toggleExcluded: () => Promise<void>;
} => {
  const view = useLiveQuery(async (): Promise<HrView | undefined> => {
    const hr = await hrStore.readLatestHr();
    if (hr === undefined) {
      return undefined;
    }
    const jd = await jdStore.readJdByJobId(hr.encryptJobId);
    return { hr, jd, excluded: hr.status === 'excluded' };
  }, []);

  // 切换排除标记：已排除则恢复，未排除则标记；写完通知后台广播给聊天页
  const toggleExcluded = async (): Promise<void> => {
    if (view === undefined) {
      return;
    }
    await hrStore.toggleExcluded(view.hr.encryptBossId);
    await sendMessage('hrsChanged', undefined);
  };

  return { view, toggleExcluded };
};

export { useHrSession };
