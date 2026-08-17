// # 数据库装配：Dexie 实例、表索引与全库 schema 版本
//
// 表实体类型来自 shared/zod 数据字典；
// 本文件集中管理表注册、索引声明与版本迁移。
import Dexie, { type EntityTable, type Table } from 'dexie';

import type {
  AiLog,
  AiPreference,
  AiVendorRecord,
  ChatMessage,
  CompanyRecord,
  DebugSetting,
  Hr,
  RecordedJd,
  ResumeRecord,
} from '@/shared/zod';

// 全局数据库实例：各领域的表统一在此注册类型
const db = new Dexie('hi-job') as Dexie & {
  jd: EntityTable<RecordedJd, 'jobId'>; // 职位明细表
  company: EntityTable<CompanyRecord, 'companyId'>; // 公司聚合表
  aiVendor: EntityTable<AiVendorRecord, 'vendorId'>; // AI 厂商配置表
  hr: EntityTable<Hr, 'encryptBossId'>; // HR 档案表
  chatMessage: Table<ChatMessage, [string, string]>; // 聊天消息流水表（复合主键）
  debugSetting: EntityTable<DebugSetting, 'key'>; // 调试开关设置表
  aiLog: EntityTable<AiLog, 'id'>; // AI 调用日志表
  aiPreference: EntityTable<AiPreference, 'key'>; // AI 调用全局偏好表
  resume: EntityTable<ResumeRecord, 'key'>; // 用户简历表（单行）
};

// 版本 1：早期表集合（会话档案与标记表已退出版本线，仅保留升级路径）
db.version(1).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  friendMark: 'encryptBossId, status, updatedAt',
  chatSession: 'encryptBossId, lastChatAt',
  debugSetting: 'key',
  aiLog: '++id, createdAt',
  aiPreference: 'key',
  resume: 'key',
});

// 版本 2：HR 档案底表 + 聊天消息流水，未列出的旧表（chatSession/friendMark）自动删除
db.version(2).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  hr: 'encryptBossId, lastMsgAt, lastChatAt, status',
  chatMessage: '[encryptBossId+msgId], encryptBossId, msgAt',
  debugSetting: 'key',
  aiLog: '++id, createdAt',
  aiPreference: 'key',
  resume: 'key',
});

export { db };
