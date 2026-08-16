// # 数据库装配：Dexie 实例、表索引与全库 schema 版本
//
// 表实体类型来自 shared/zod 数据字典；
// 本文件集中管理表注册、索引声明与版本迁移。
import Dexie, { type EntityTable } from 'dexie';

import type {
  AiVendorRecord,
  ChatSession,
  CompanyRecord,
  DebugSetting,
  FriendMark,
  RecordedJd,
  ThinkingModeSetting,
} from '@/shared/zod';

// 全局数据库实例：各领域的表统一在此注册类型
const db = new Dexie('hi-job') as Dexie & {
  jd: EntityTable<RecordedJd, 'jobId'>; // 职位明细表
  company: EntityTable<CompanyRecord, 'companyId'>; // 公司聚合表
  aiVendor: EntityTable<AiVendorRecord, 'vendorId'>; // AI 厂商配置表
  friendMark: EntityTable<FriendMark, 'encryptBossId'>; // HR 会话标记表
  chatSession: EntityTable<ChatSession, 'encryptBossId'>; // 聊天会话档案表
  debugSetting: EntityTable<DebugSetting, 'key'>; // 调试开关设置表
  thinkingMode: EntityTable<ThinkingModeSetting, 'key'>; // 思考模式设置表
};

// 全部表统一在 v1 一次声明（首字段为主键，其余为索引）；
// 开发环境不做版本增量迁移，新增表直接并入 v1
db.version(1).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  friendMark: 'encryptBossId, status, updatedAt',
  chatSession: 'encryptBossId, lastChatAt',
  debugSetting: 'key',
  thinkingMode: 'key',
});

export { db };
