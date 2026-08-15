import type { SelectedJd } from '@/shared/zod/jd';

import { db } from '../db';
import type { CompanyRecord, RecordedJd } from './schema';

// > 记录一次选中的 JD：按主键 upsert，同一职位累计次数，公司聚合同事务更新
const saveSelectedJd = async ({ jd }: { jd: SelectedJd }): Promise<void> => {
  if (jd.jobId === '' || jd.companyId === '') {
    return;
  }

  const now = Date.now();
  await db.transaction('rw', db.jd, db.company, async () => {
    const existing = await db.jd.get(jd.jobId);
    const isNewJob = existing === undefined;
    const recorded: RecordedJd =
      existing === undefined
        ? { ...jd, firstSeenAt: now, lastSeenAt: now, seenCount: 1 }
        : { ...existing, lastSeenAt: now, seenCount: existing.seenCount + 1 };
    await db.jd.put(recorded);

    const company = await db.company.get(jd.companyId);
    const nextCompany: CompanyRecord =
      company === undefined
        ? {
            companyId: jd.companyId,
            companyName: jd.companyName,
            jobIds: [jd.jobId],
            firstSeenAt: now,
            lastSeenAt: now,
          }
        : {
            ...company,
            jobIds: isNewJob ? [...company.jobIds, jd.jobId] : company.jobIds,
            lastSeenAt: now,
          };
    await db.company.put(nextCompany);
  });
};

// 读取全部已记录职位，按最近出现时间倒序（走 lastSeenAt 索引）
const readAllRecordedJds = (): Promise<RecordedJd[]> =>
  db.jd.orderBy('lastSeenAt').reverse().toArray();

// 读取全部公司记录，按最近出现时间倒序
const readAllCompanyRecords = (): Promise<CompanyRecord[]> =>
  db.company.orderBy('lastSeenAt').reverse().toArray();

// 清空职位与公司两张表，事务保证两边一起清
const clearAll = async (): Promise<void> => {
  await db.transaction('rw', db.jd, db.company, async () => {
    await db.jd.clear();
    await db.company.clear();
  });
};

// jd 领域仓储：职位明细与公司聚合的统一读写入口
const jdStore = {
  saveSelectedJd, // 记录一次选中的 JD：按主键 upsert 并同步公司聚合
  readAllRecordedJds, // 读取全部职位，按最近出现时间倒序
  readAllCompanyRecords, // 读取全部公司，按最近出现时间倒序
  clearAll, // 清空职位与公司两张表
};

export { jdStore };
