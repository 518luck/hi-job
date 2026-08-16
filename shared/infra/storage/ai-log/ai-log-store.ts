// # ai-log 领域仓储：AI 调用日志的写入、读取与清空
import type { AiLog, AiLogInput } from '@/shared/zod';

import { db } from '../db';

// 日志保留上限：超出后裁剪最旧记录
const AI_LOG_LIMIT = 200;

// 追加一条日志：写入后裁剪超过上限的最旧记录
const appendAiLog = async (entry: AiLogInput): Promise<void> => {
  await db.transaction('rw', db.aiLog, async () => {
    await db.aiLog.add(entry);
    const count = await db.aiLog.count();
    if (count > AI_LOG_LIMIT) {
      const overflowKeys = await db.aiLog
        .orderBy('id')
        .limit(count - AI_LOG_LIMIT)
        .primaryKeys();
      await db.aiLog.bulkDelete(overflowKeys);
    }
  });
};

// 读取日志：按写入顺序倒序（最新在前）
const listAiLogs = async (): Promise<AiLog[]> =>
  db.aiLog.orderBy('id').reverse().toArray();

// 清空全部日志
const clearAiLogs = async (): Promise<void> => {
  await db.aiLog.clear();
};

// ai-log 领域仓储：AI 调用日志的写入、读取与清空
const aiLogStore = {
  appendAiLog, // 追加一条日志（自动裁剪最旧）
  listAiLogs, // 读取日志（最新在前）
  clearAiLogs, // 清空日志
};

export { aiLogStore };
