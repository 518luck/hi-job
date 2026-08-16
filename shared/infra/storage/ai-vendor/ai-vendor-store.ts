import type { AiVendorRecord } from '@/shared/zod';

import { db } from '../db';

// 保存厂商配置：按主键 upsert，编辑时保留原 createdAt
const saveVendor = async ({
  vendor,
}: {
  vendor: AiVendorRecord;
}): Promise<void> => {
  const now = Date.now();
  const existing = await db.aiVendor.get(vendor.vendorId);
  await db.aiVendor.put({
    ...vendor,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
};

// 删除一条厂商配置
const removeVendor = async ({
  vendorId,
}: {
  vendorId: string;
}): Promise<void> => {
  await db.aiVendor.delete(vendorId);
};

// 读取全部厂商配置，按最近编辑时间倒序（走 updatedAt 索引）
const readAllVendors = (): Promise<AiVendorRecord[]> =>
  db.aiVendor.orderBy('updatedAt').reverse().toArray();

// ai-vendor 领域仓储：AI 厂商配置的统一读写入口
const aiVendorStore = {
  saveVendor, // 保存厂商配置：按主键 upsert 并维护时间戳
  removeVendor, // 删除一条厂商配置
  readAllVendors, // 读取全部厂商配置，按最近编辑时间倒序
};

export { aiVendorStore };
