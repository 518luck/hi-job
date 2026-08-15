import {
  type CompanyRecord,
  companyRecordSchema,
  type RecordedJd,
  recordedJdSchema,
  type SelectedJd,
  type StoreIndex,
  storeIndexSchema,
} from '@/shared/zod/jd';
import {
  namespacedKey,
  readItem,
  readItems,
  watchKey,
  writeItems,
} from '../lib/kv';

// jd 领域的存储 key 工厂，所有 key 都挂在该命名空间下
const key = namespacedKey('jd');

// 存储索引 key；每次写入都会 touch 它，侧边栏靠监听它刷新
const INDEX_KEY = key('index');

// 拼出单个职位的存储 key
const jdKeyOf = (jobId: string) => key('job', jobId);

// 拼出单个公司的存储 key
const companyKeyOf = (companyId: string) => key('company', companyId);

// 读存储索引，缺失或损坏时回退空索引
const readIndex = async (): Promise<StoreIndex> =>
  (await readItem({ key: INDEX_KEY, schema: storeIndexSchema })) ?? {
    jobIds: [],
    companyIds: [],
  };

// > 记录一次选中的 JD：新职位建明细并追加索引，旧职位只累计时间与次数
const saveSelectedJd = async ({ jd }: { jd: SelectedJd }): Promise<void> => {
  if (jd.jobId === '' || jd.companyId === '') {
    return;
  }

  const now = Date.now();
  const index = await readIndex();

  const existingJd = await readItem({
    key: jdKeyOf(jd.jobId),
    schema: recordedJdSchema,
  });
  const isNewJob = existingJd === null;
  const recorded: RecordedJd =
    existingJd === null
      ? { ...jd, firstSeenAt: now, lastSeenAt: now, seenCount: 1 }
      : { ...existingJd, lastSeenAt: now, seenCount: existingJd.seenCount + 1 };

  const existingCompany = await readItem({
    key: companyKeyOf(jd.companyId),
    schema: companyRecordSchema,
  });
  const company: CompanyRecord =
    existingCompany === null
      ? {
          companyId: jd.companyId,
          companyName: jd.companyName,
          jobIds: [jd.jobId],
          firstSeenAt: now,
          lastSeenAt: now,
        }
      : {
          ...existingCompany,
          jobIds: isNewJob
            ? [...existingCompany.jobIds, jd.jobId]
            : existingCompany.jobIds,
          lastSeenAt: now,
        };

  const nextIndex: StoreIndex = {
    jobIds: isNewJob ? [...index.jobIds, jd.jobId] : index.jobIds,
    companyIds: index.companyIds.includes(jd.companyId)
      ? index.companyIds
      : [...index.companyIds, jd.companyId],
  };

  await writeItems([
    { key: jdKeyOf(jd.jobId), value: recorded },
    { key: companyKeyOf(jd.companyId), value: company },
    { key: INDEX_KEY, value: nextIndex },
  ]);
};

// 读取全部已记录职位，按最近出现时间倒序
const readAllRecordedJds = async (): Promise<RecordedJd[]> => {
  const { jobIds } = await readIndex();
  const jds = await readItems({
    keys: jobIds.map(jdKeyOf),
    schema: recordedJdSchema,
  });
  return jds.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
};

// 读取全部公司记录，按最近出现时间倒序
const readAllCompanyRecords = async (): Promise<CompanyRecord[]> => {
  const { companyIds } = await readIndex();
  const companies = await readItems({
    keys: companyIds.map(companyKeyOf),
    schema: companyRecordSchema,
  });
  return companies.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
};

// 监听索引变化以感知新记录，返回取消监听函数
const watchStore = (callback: () => void) =>
  watchKey({ key: INDEX_KEY, onChange: callback });

// jd 领域仓储：职位明细、公司聚合与索引的统一读写入口
const jdStore = {
  saveSelectedJd,
  readAllRecordedJds,
  readAllCompanyRecords,
  watchStore,
};

export { jdStore };
