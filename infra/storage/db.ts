// # 数据库装配：Dexie 实例、表索引与全库 schema 版本
//
// 表实体类型来自 shared/zod 数据字典；
// 本文件集中管理表注册、索引声明与版本迁移。
import Dexie, { type EntityTable } from 'dexie';

import type { AiVendorRecord, CompanyRecord, RecordedJd } from '@/shared/zod';

// 全局数据库实例：各领域的表统一在此注册类型
const db = new Dexie('hi-job') as Dexie & {
  jd: EntityTable<RecordedJd, 'jobId'>; // 职位明细表
  company: EntityTable<CompanyRecord, 'companyId'>; // 公司聚合表
  aiVendor: EntityTable<AiVendorRecord, 'vendorId'>; // AI 厂商配置表
};

// 全部表在 v1 一次声明（首字段为主键，其余为索引）；
// 后续结构变更递增 version 只写增量声明，禁止回改已写下的版本
db.version(1).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
});

export { db };
