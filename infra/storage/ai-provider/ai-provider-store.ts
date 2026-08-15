import { db } from '../db';
import type { AiProviderRecord } from './schema';

// 保存厂商配置：按主键 upsert，编辑时保留原 createdAt
const saveAiProvider = async ({
  provider,
}: {
  provider: AiProviderRecord;
}): Promise<void> => {
  const now = Date.now();
  const existing = await db.aiProvider.get(provider.providerId);
  await db.aiProvider.put({
    ...provider,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
};

// 删除一条厂商配置
const removeAiProvider = async ({
  providerId,
}: {
  providerId: string;
}): Promise<void> => {
  await db.aiProvider.delete(providerId);
};

// 读取全部厂商配置，按最近编辑时间倒序（走 updatedAt 索引）
const readAllAiProviders = (): Promise<AiProviderRecord[]> =>
  db.aiProvider.orderBy('updatedAt').reverse().toArray();

// ai-provider 领域仓储：AI 模型厂商配置的统一读写入口
const aiProviderStore = {
  saveAiProvider, // 保存厂商配置：按主键 upsert 并维护时间戳
  removeAiProvider, // 删除一条厂商配置
  readAllAiProviders, // 读取全部厂商配置，按最近编辑时间倒序
};

export { aiProviderStore };
