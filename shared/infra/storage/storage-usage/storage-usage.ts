// # storage-usage 领域仓储：持久化数据占用统计的统一读取入口

// 扩展源存储估算：浏览器报告的已用量与配额
interface OriginUsage {
  usageBytes: number; // 已用字节数（含本源全部存储，如 IndexedDB）
  quotaBytes: number; // 可用配额字节数
}

// 读取扩展源存储估算：浏览器不支持 estimate 时返回 undefined
const readOriginUsage = async (): Promise<OriginUsage | undefined> => {
  const estimate = await navigator.storage.estimate();
  if (estimate.usage === undefined || estimate.quota === undefined) {
    return undefined;
  }
  return { usageBytes: estimate.usage, quotaBytes: estimate.quota };
};

// storage-usage 领域仓储：持久化数据占用统计的统一读取入口
const storageUsageStore = {
  readOriginUsage, // 读取扩展源存储估算
};

export type { OriginUsage };
export { storageUsageStore };
