import type { CompanyRecord, RecordedJd, SelectedJd } from '@/shared/zod';

import { db } from '../db';

// > 记录一次选中的 JD：按主键 upsert，同一职位累计次数，公司聚合同事务更新
const saveSelectedJd = async ({ jd }: { jd: SelectedJd }): Promise<void> => {
  if (jd.jobId === '' || jd.companyId === '') {
    return;
  }

  const now = Date.now();
  await db.transaction('rw', db.jd, db.company, async () => {
    const existingJd = await db.jd.get(jd.jobId);
    const isNewJob = existingJd === undefined;
    await db.jd.put(nextJdRecord({ jd, existing: existingJd, now }));

    const existingCompany = await db.company.get(jd.companyId);
    await db.company.put(
      nextCompanyRecord({ jd, existing: existingCompany, isNewJob, now }),
    );
  });
};

// 合成下一版 jd 行：初见整份落库；再见冻结职位快照，只追新公司级属性并累计元信息
const nextJdRecord = ({
  jd,
  existing,
  now,
}: {
  jd: SelectedJd;
  existing: RecordedJd | undefined;
  now: number;
}): RecordedJd => {
  if (existing === undefined) {
    return { ...jd, firstSeenAt: now, lastSeenAt: now, seenCount: 1 };
  }
  return {
    ...existing,
    companyName: jd.companyName,
    companyIndustry: freshOr(jd.companyIndustry, existing.companyIndustry),
    companyScale: freshOr(jd.companyScale, existing.companyScale),
    lastSeenAt: now,
    seenCount: existing.seenCount + 1,
  };
};

// 合成下一版 company 行：初见建档；再见追新公司属性，仅新职位追加 jobIds
const nextCompanyRecord = ({
  jd,
  existing,
  isNewJob,
  now,
}: {
  jd: SelectedJd;
  existing: CompanyRecord | undefined;
  isNewJob: boolean;
  now: number;
}): CompanyRecord => {
  if (existing === undefined) {
    return {
      companyId: jd.companyId,
      companyName: jd.companyName,
      industryName: jd.companyIndustry,
      scaleName: jd.companyScale,
      jobIds: [jd.jobId],
      firstSeenAt: now,
      lastSeenAt: now,
    };
  }
  return {
    ...existing,
    companyName: jd.companyName,
    industryName: freshOr(jd.companyIndustry, existing.industryName),
    scaleName: freshOr(jd.companyScale, existing.scaleName),
    jobIds: isNewJob ? [...existing.jobIds, jd.jobId] : existing.jobIds,
    lastSeenAt: now,
  };
};

// 采集值非空则采用，为空（桥读取失败）时保留旧值
const freshOr = (fresh: string, stale: string): string =>
  fresh !== '' ? fresh : stale;

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
