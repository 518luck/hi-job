import { Button } from '@/shared/ui/button';

import { useStorageUsage } from '../model/use-storage-usage';

// 字节数格式化：GB/MB 保留一位小数，不足 0.1 MB 显示 KB
const sizeText = (bytes: number): string => {
  if (bytes === 0) {
    return '0 KB';
  }
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  if (mb >= 0.1) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// 存储占用区块：扩展源总量估算，可手动刷新
function StorageUsageSection() {
  const { origin, refresh } = useStorageUsage();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">存储占用</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void refresh()}
        >
          刷新
        </Button>
      </div>
      {origin !== undefined ? (
        <div className="flex items-center justify-between text-xs">
          <span>本扩展已用 / 配额</span>
          <span className="text-muted-foreground">
            {sizeText(origin.usageBytes)} / {sizeText(origin.quotaBytes)}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">读取中…</p>
      )}
      <p className="text-xs text-muted-foreground">
        数据为浏览器对本扩展源的存储估算（含全部本地数据）；清理数据请到记录页各列表操作。
      </p>
    </div>
  );
}

export { StorageUsageSection };
