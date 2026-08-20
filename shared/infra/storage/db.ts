// # 数据库装配：Dexie 实例、表索引与全库 schema 版本
//
// 表实体类型来自 shared/zod 数据字典；
// 本文件集中管理表注册、索引声明与版本迁移。
import Dexie, { type EntityTable, type Table } from 'dexie';

import type {
  AiLog,
  AiPreference,
  AiVendorRecord,
  BlockedCompany,
  ChatMessage,
  CompanyRecord,
  ConsentRecord,
  DebugSetting,
  Hr,
  RecordedJd,
  ResumeRecord,
  ResumeSupplementRecord,
} from '@/shared/zod';

// 全局数据库实例：各领域的表统一在此注册类型
const db = new Dexie('hi-job') as Dexie & {
  jd: EntityTable<RecordedJd, 'jobId'>; // 职位明细表
  company: EntityTable<CompanyRecord, 'companyId'>; // 公司聚合表
  aiVendor: EntityTable<AiVendorRecord, 'vendorId'>; // AI 厂商配置表
  hr: EntityTable<Hr, 'encryptBossId'>; // HR 档案表
  chatMessage: Table<ChatMessage, [string, string]>; // 聊天消息流水表（复合主键）
  debugSetting: EntityTable<DebugSetting, 'key'>; // 调试开关设置表
  blockedCompany: EntityTable<BlockedCompany, 'key'>; // 屏蔽公司名单表
  aiLog: EntityTable<AiLog, 'id'>; // AI 调用日志表
  aiPreference: EntityTable<AiPreference, 'key'>; // AI 调用全局偏好表
  resume: EntityTable<ResumeRecord, 'key'>; // 用户简历表（单行）
  resumeSupplement: EntityTable<ResumeSupplementRecord, 'key'>; // 简历外补充素材表（单行）
  consent: EntityTable<ConsentRecord, 'key'>; // 用户确认记录表（单行）
};

// v1 初版表集合：历史版本声明原样保留，自 v2 起新增表以追加 version 方式演进，升级不清库
db.version(1).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  hr: 'encryptBossId, lastMsgAt, lastChatAt, status',
  chatMessage: '[encryptBossId+msgId], encryptBossId, msgAt',
  debugSetting: 'key',
  blockedCompany: 'key',
  aiLog: '++id, createdAt',
  aiPreference: 'key',
  resume: 'key',
  consent: 'key',
});

// v2：新增 resumeSupplement 表（简历外补充素材），stores 传全量表清单，v1 声明原样保留
db.version(2).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  hr: 'encryptBossId, lastMsgAt, lastChatAt, status',
  chatMessage: '[encryptBossId+msgId], encryptBossId, msgAt',
  debugSetting: 'key',
  blockedCompany: 'key',
  aiLog: '++id, createdAt',
  aiPreference: 'key',
  resume: 'key',
  consent: 'key',
  resumeSupplement: 'key',
});

export { db };
