// # AI 日志视图：摘要列表虚拟滚动，点击行展开实际传递参数与错误详情

import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef, useState } from 'react';

import { Accordion } from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { FILTER_DESCRIPTIONS, type LogFilter } from '../../config/log-labels';
import { logsTextOf } from '../../model/log-format';
import { useAiLogs } from '../../model/use-ai-logs';
import { LogCard } from './log-card';

// AI 日志视图的 props：onBack 返回调试页首页
interface AiLogViewProps {
  onBack: () => void;
}

// AI 日志视图：来源分层筛选 + 手风琴列表虚拟滚动展开详情，提供复制全部与清空入口
function AiLogView({ onBack }: AiLogViewProps) {
  const { logs, clear } = useAiLogs();
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<LogFilter>('all');
  const listRef = useRef<HTMLDivElement>(null);

  // 按来源分层过滤后的日志列表
  const filteredLogs = useMemo(
    () =>
      filter === 'all' ? logs : logs.filter((log) => log.source === filter),
    [logs, filter],
  );

  // 日志列表虚拟滚动：卡片高度随展开动态变化，由 measureElement 实测校正
  const logVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 140,
    overscan: 6,
    getItemKey: (index) => filteredLogs[index]?.id ?? index,
  });

  // 一键复制当前列表日志到剪贴板，短暂切换按钮文案
  const handleCopyAll = async (): Promise<void> => {
    await navigator.clipboard.writeText(logsTextOf(filteredLogs));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  // 当前视口内的虚拟条目
  const virtualItems = logVirtualizer.getVirtualItems();

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
          <h2 className="text-base font-medium">AI 日志</h2>
        </div>
        {logs.length > 0 && (
          <div className="flex items-center gap-1">
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
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                void clear();
              }}
            >
              <Icons.clearData data-icon="inline-start" />
              <span>清空</span>
            </Button>
          </div>
        )}
      </div>
      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-2"
        value={filter}
        onValueChange={(next) => {
          if (next !== null) {
            setFilter(next as LogFilter);
            // 切换筛选后回到列表顶部，避免残留上个分类的滚动位置
            listRef.current?.scrollTo({ top: 0 });
          }
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            全部
          </TabsTrigger>
          <TabsTrigger value="greeting" className="flex-1">
            打招呼
          </TabsTrigger>
          <TabsTrigger value="reply" className="flex-1">
            回复
          </TabsTrigger>
          <TabsTrigger value="followUp" className="flex-1">
            跟进
          </TabsTrigger>
          <TabsTrigger value="rejectionFeedback" className="flex-1">
            反馈
          </TabsTrigger>
          <TabsTrigger value="resumeOrganize" className="flex-1">
            简历
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value={filter}
          className="flex min-h-0 flex-1 flex-col gap-2"
        >
          <p className="text-xs text-muted-foreground">
            {FILTER_DESCRIPTIONS[filter]}
          </p>
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {logs.length === 0 ? '暂无 AI 调用日志' : '该分类暂无日志'}
            </p>
          ) : (
            <Accordion className="flex min-h-0 flex-1 flex-col">
              {/* 日志列表滚动容器：overflow-anchor 关闭，避免新日志插入顶部时视口跳动 */}
              <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto [overflow-anchor:none]"
              >
                {/* 虚拟化占位层：总高度撑开滚动范围 */}
                <div
                  className="relative w-full"
                  style={{ height: logVirtualizer.getTotalSize() }}
                >
                  {/* 块平移：整块按首条偏移定位，条目正常流，平滑滚动时未测量条目不错位 */}
                  <div
                    className="absolute inset-x-0 top-0"
                    style={{
                      transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                    }}
                  >
                    {virtualItems.map((virtualItem) => {
                      const log = filteredLogs[virtualItem.index];
                      if (log === undefined) {
                        return null;
                      }
                      return (
                        <div
                          key={virtualItem.key}
                          data-index={virtualItem.index}
                          ref={logVirtualizer.measureElement}
                          className="w-full pb-1"
                        >
                          <LogCard log={log} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AiLogView };
