// # blocked-company 领域仓储：屏蔽公司名单的统一读写入口
import { BLOCKED_COMPANY_KEY } from '@/shared/zod';

import { db } from '../db';

// 保存屏蔽公司名单：单行覆盖写入
const saveBlockedCompanies = async (names: string[]): Promise<void> => {
  await db.blockedCompany.put({
    key: BLOCKED_COMPANY_KEY,
    names,
  });
};

// 读取屏蔽公司名单：无记录时返回空数组
const readBlockedCompanies = async (): Promise<string[]> => {
  const record = await db.blockedCompany.get(BLOCKED_COMPANY_KEY);
  return record?.names ?? [];
};

// blocked-company 领域仓储：屏蔽公司名单的统一读写入口
const blockedCompanyStore = {
  saveBlockedCompanies, // 保存屏蔽公司名单
  readBlockedCompanies, // 读取屏蔽公司名单（无记录时为空数组）
};

export { blockedCompanyStore };
