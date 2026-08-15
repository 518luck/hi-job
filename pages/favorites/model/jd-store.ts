import type { z } from 'zod';
import type {
  CompanyRecord,
  RecordedJd,
  SelectedJd,
  StoreIndex,
} from '@/shared/zod/jd';
import {
  companyRecordSchema,
  recordedJdSchema,
  storeIndexSchema,
} from '@/shared/zod/jd';

// 存储索引 key；每次写入都会 touch 它，侧边栏靠监听它刷新
const INDEX_KEY = 'local:index';

// 拼出单个职位的存储 key
const jdKeyOf = (jobId: string): `local:${string}` => `local:jd:${jobId}`;

// 拼出单个公司的存储 key
const companyKeyOf = (companyId: string): `local:${string}` =>
  `local:company:${companyId}`;

// 校验存储读出的单条数据，坏数据返回 null
const parseItem = <T>({
  schema,
  raw,
}: {
  schema: z.ZodType<T>;
  raw: unknown;
}): T | null => {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

// 读存储索引，缺失或损坏时回退空索引
const readIndex = async (): Promise<StoreIndex> => {
  const raw = await storage.getItem<unknown>(INDEX_KEY);
  const parsed = parseItem({ schema: storeIndexSchema, raw });
  return parsed ?? { jobIds: [], companyIds: [] };
};

// > 记录一次选中的 JD：新职位建明细并追加索引，旧职位只累计时间与次数
const saveSelectedJd = async ({ jd }: { jd: SelectedJd }): Promise<void> => {
  if (jd.jobId === '' || jd.companyId === '') {
    return;
  }

  const now = Date.now();
  const index = await readIndex();

  const existingJd = parseItem({
    schema: recordedJdSchema,
    raw: await storage.getItem<unknown>(jdKeyOf(jd.jobId)),
  });
  const isNewJob = existingJd === null;
  const recorded: RecordedJd =
    existingJd === null
      ? { ...jd, firstSeenAt: now, lastSeenAt: now, seenCount: 1 }
      : { ...existingJd, lastSeenAt: now, seenCount: existingJd.seenCount + 1 };

  const existingCompany = parseItem({
    schema: companyRecordSchema,
    raw: await storage.getItem<unknown>(companyKeyOf(jd.companyId)),
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

  await storage.setItems([
    { key: jdKeyOf(jd.jobId), value: recorded },
    { key: companyKeyOf(jd.companyId), value: company },
    { key: INDEX_KEY, value: nextIndex },
  ]);
};

// 读取全部已记录职位，按最近出现时间倒序
const readAllRecordedJds = async (): Promise<RecordedJd[]> => {
  const { jobIds } = await readIndex();
  const items = await storage.getItems(jobIds.map(jdKeyOf));
  const jds = items
    .map((item) => parseItem({ schema: recordedJdSchema, raw: item.value }))
    .filter((jd): jd is RecordedJd => jd !== null);
  return jds.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
};

// 读取全部公司记录，按最近出现时间倒序
const readAllCompanyRecords = async (): Promise<CompanyRecord[]> => {
  const { companyIds } = await readIndex();
  const items = await storage.getItems(companyIds.map(companyKeyOf));
  const companies = items
    .map((item) => parseItem({ schema: companyRecordSchema, raw: item.value }))
    .filter((company): company is CompanyRecord => company !== null);
  return companies.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
};

// 监听索引变化以感知新记录，返回取消监听函数
const watchStore = (callback: () => void) => storage.watch(INDEX_KEY, callback);

export {
  readAllCompanyRecords,
  readAllRecordedJds,
  saveSelectedJd,
  watchStore,
};
