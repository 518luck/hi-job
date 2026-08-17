// # 页面采集日志视图：当前 BOSS 页面会话的采集日志表格，虚拟滚动展示

import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import type { features } from '@/shared/ui/data-table';
import { DataTable } from '@/shared/ui/data-table';
import { Icons } from '@/shared/ui/icons';

import type { PageLogRow } from '../../model/use-page-debug-logs';
import { usePageDebugLogs } from '../../model/use-page-debug-logs';

// 页面采集日志视图的 props：onBack 返回调试页首页
interface PageLogViewProps {
  onBack: () => void;
}

// 拼接全部日志为可复制文本：恢复时间前缀，按时间正序排列
const logsTextOf = (rows: PageLogRow[]): string =>
  [...rows]
    .reverse()
    .map((row) => (row.time === '' ? row.text : `[${row.time}] ${row.text}`))
    .join('\n');

// 日志行列定义：时间窄列 + 内容宽列，均可排序
const logColumns: ColumnDef<typeof features, PageLogRow>[] = [
  { accessorKey: 'time', header: '时间' },
  { accessorKey: 'text', header: '内容' },
];

// 页面采集日志视图：拉取当前 BOSS 页面会话日志，表格展示并支持手动刷新
function PageLogView({ onBack }: PageLogViewProps) {
  const { rows, refresh } = usePageDebugLogs();
  const [copied, setCopied] = useState(false);

  // 一键复制当前日志到剪贴板，短暂切换按钮文案
  const handleCopyAll = async (): Promise<void> => {
    await navigator.clipboard.writeText(logsTextOf(rows));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            title="返回调试页"
            aria-label="返回调试页"
            onClick={onBack}
          >
            <Icons.chevronDown className="rotate-90" />
          </Button>
          <h2 className="text-base font-medium">页面采集日志</h2>
        </div>
        <div className="flex items-center gap-1">
          {rows.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                void handleCopyAll();
              }}
            >
              <Icons.copy data-icon="inline-start" />
              <span>{copied ? '已复制' : '复制全部'}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              void refresh();
            }}
          >
            <Icons.refresh data-icon="inline-start" />
            <span>刷新</span>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        显示最近聚焦的 BOSS 页面会话日志（保留最近 200
        条）；切换页面后点「刷新」拉取最新。
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          暂无日志：请先打开 BOSS 直聘页面（职位列表或聊天页），再来此处刷新。
        </p>
      ) : (
        <DataTable
          columns={logColumns}
          data={rows}
          estimateSize={() => 32}
          getCellClassName={(columnId) =>
            columnId === 'time'
              ? 'w-20 flex-none'
              : 'whitespace-normal break-all'
          }
        />
      )}
    </div>
  );
}

export { PageLogView };
