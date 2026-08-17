// # hr 领域仓储：HR 档案的统一读写入口
import type { Hr, HrInput } from '@/shared/zod';

import { db } from '../db';

// 上报当前 HR：刷新档案并盖章最近打开时间，保留自标状态与首次同步时间
const saveHr = async (input: HrInput): Promise<void> => {
  const now = Date.now();
  const existing = await db.hr.get(input.encryptBossId);
  await db.hr.put({
    ...input,
    status: existing?.status ?? null,
    lastChatAt: now,
    firstSeenAt: existing?.firstSeenAt ?? now,
    updatedAt: now,
  });
};

// 批量同步 HR：按 encryptBossId 合并，保留自标与最近打开时间，新记录 lastChatAt 置 0
const saveHrs = async (inputs: HrInput[]): Promise<void> => {
  if (inputs.length === 0) {
    return;
  }
  const now = Date.now();
  const existing = await db.hr.bulkGet(
    inputs.map((input) => input.encryptBossId),
  );
  const records = inputs.map((input, index) => {
    const prev = existing[index];
    return {
      ...input,
      status: prev?.status ?? null,
      lastChatAt: prev?.lastChatAt ?? 0,
      firstSeenAt: prev?.firstSeenAt ?? now,
      updatedAt: now,
    };
  });
  await db.hr.bulkPut(records);
};

// 读取全部 HR：记录页 HR 列表按最后沟通时间倒序
const readAllHrs = (): Promise<Hr[]> =>
  db.hr.orderBy('lastMsgAt').reverse().toArray();

// 读取最近打开的 HR 档案：工作台展示当前沟通的 HR
const readLatestHr = (): Promise<Hr | undefined> =>
  db.hr.orderBy('lastChatAt').last();

// 读取被排除的 HR id 列表：聊天页渲染「已 Pass」遮罩
const readExcludedHrIds = (): Promise<string[]> =>
  db.hr.where('status').equals('excluded').primaryKeys();

// 切换排除标记：已排除则恢复，未排除则标记，返回切换后的状态
const toggleExcluded = async (encryptBossId: string): Promise<boolean> => {
  const hr = await db.hr.get(encryptBossId);
  if (hr === undefined) {
    return false;
  }
  const excluded = hr.status !== 'excluded';
  await db.hr.update(encryptBossId, {
    status: excluded ? 'excluded' : null,
  });
  return excluded;
};

// 清空全部 HR 档案：清除数据库时一并清理
const clearAllHrs = (): Promise<void> => db.hr.clear();

// hr 领域仓储：档案读写的统一入口
const hrStore = {
  saveHr, // 上报当前 HR
  saveHrs, // 批量同步 HR
  readAllHrs, // 读取全部 HR
  readLatestHr, // 读取最近打开 HR
  readExcludedHrIds, // 读取被排除名单
  toggleExcluded, // 切换排除标记
  clearAllHrs, // 清空全部 HR
};

export { hrStore };
