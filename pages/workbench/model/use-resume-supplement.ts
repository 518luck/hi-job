import { useLiveQuery } from 'dexie-react-hooks';

import { resumeSupplementStore } from '@/shared/infra/storage';
import type { ResumeSupplementRecord } from '@/shared/zod';

// 工作台简历外补充：读取单行补充素材，供折叠卡片展示与失焦保存
const useResumeSupplement = (): {
  supplement?: ResumeSupplementRecord;
  saveSupplement: (content: string) => Promise<void>;
} => {
  const supplement = useLiveQuery(
    () => resumeSupplementStore.readResumeSupplement(),
    [],
  );

  // 保存补充素材：覆盖写入并刷新时间戳（由卡片在失焦且内容变化时调用）
  const saveSupplement = async (content: string): Promise<void> => {
    await resumeSupplementStore.saveResumeSupplement(content);
  };

  return {
    supplement,
    saveSupplement,
  };
};

export { useResumeSupplement };
