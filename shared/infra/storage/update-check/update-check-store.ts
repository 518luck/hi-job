// # update-check 领域仓储：远端版本检查缓存的统一读写入口
import type { UpdateCheck } from '@/shared/zod';
import { UPDATE_CHECK_KEY } from '@/shared/zod';

import { db } from '../db';

// 读取版本检查缓存：从未检查过时返回 undefined
const readUpdateCheck = (): Promise<UpdateCheck | undefined> =>
  db.updateCheck.get(UPDATE_CHECK_KEY);

// 保存版本检查缓存：单行覆盖写入
const saveUpdateCheck = async (record: UpdateCheck): Promise<void> => {
  await db.updateCheck.put(record);
};

// update-check 领域仓储：远端版本检查缓存的统一读写入口
const updateCheckStore = {
  readUpdateCheck, // 读取缓存（从未检查过时 undefined）
  saveUpdateCheck, // 覆盖写入缓存
};

export { updateCheckStore };
