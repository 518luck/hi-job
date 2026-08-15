// # 数据库装配：Dexie 实例与全库表注册清单
//
// 各领域的表结构（字段字典 + 索引声明）在各自领域的 schema.ts 中定义；
// 本文件只做装配：注册表类型与索引、集中管理 schema 版本。
import Dexie, { type EntityTable } from 'dexie';

import type { CompanyRecord, RecordedJd } from './jd/schema';
import { JD_TABLES } from './jd/schema';

// 全局数据库实例：各领域的表统一在此注册类型
const db = new Dexie('hi-job') as Dexie & {
  jd: EntityTable<RecordedJd, 'jobId'>; // 职位明细表
  company: EntityTable<CompanyRecord, 'companyId'>; // 公司聚合表
};

// 表索引来自各领域 schema；新增字段递增 version 并只写增量迁移，禁止修改已发布的旧版本声明
db.version(1).stores({
  jd: JD_TABLES.jd,
  company: JD_TABLES.company,
});

export { db };
