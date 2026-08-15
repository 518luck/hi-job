// # jd 领域表结构：字段字典与索引声明的单一事实来源
//
// 基础字段继承 shared/zod 的传输 DTO（selectedJdSchema），此处定义落库实体；
// 索引声明（JD_TABLES）供 db.ts 注册，新增字段需在 db.ts 递增 version 写增量迁移。
import { z } from 'zod';

import { selectedJdSchema } from '@/shared/zod/jd';

// 表 jd（职位明细）：主键 jobId，索引 companyId / lastSeenAt
// 职位基础字段（jobId/companyId/title/salary/tags/... 共 10 个）继承自 selectedJdSchema，此处追加记录元信息
const recordedJdSchema = selectedJdSchema.extend({
  firstSeenAt: z.number(), // 首次记录的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近记录的时间戳（毫秒）
  seenCount: z.number(), // 该职位被点开的总次数
});

// 表 company（公司推送聚合）：主键 companyId，索引 lastSeenAt
const companyRecordSchema = z.object({
  companyId: z.string(), // 公司唯一 id，与 selectedJdSchema 的 companyId 一致
  companyName: z.string(), // 公司名
  jobIds: z.array(z.string()), // 该公司推送过的全部职位 id
  firstSeenAt: z.number(), // 首次出现的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近出现的时间戳（毫秒）
});

// 从 schema 派生表实体类型，保持单一事实来源
type RecordedJd = z.infer<typeof recordedJdSchema>;
type CompanyRecord = z.infer<typeof companyRecordSchema>;

// 两张表的 Dexie 索引声明：首字段为主键，其余为索引
const JD_TABLES = {
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
} as const;

export type { CompanyRecord, RecordedJd };
export { JD_TABLES };
