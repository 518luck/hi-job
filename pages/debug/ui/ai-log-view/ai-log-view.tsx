// # AI 日志视图：摘要列表，点击行展开实际传递参数与错误详情
import { useState } from 'react';

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

// AI 日志视图：来源分层筛选 + 手风琴列表展开详情，提供复制全部与清空入口
function AiLogView({ onBack }: AiLogViewProps) {
  const { logs, clear } = useAiLogs();
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<LogFilter>('all');

  // 按来源分层过滤后的日志列表
  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.source === filter);

  // 一键复制当前列表日志到剪贴板，短暂切换按钮文案
  const handleCopyAll = async (): Promise<void> => {
    await navigator.clipboard.writeText(logsTextOf(filteredLogs));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
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
        className="w-full"
        value={filter}
        onValueChange={(next) => {
          if (next !== null) {
            setFilter(next as LogFilter);
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
        </TabsList>
        <TabsContent value={filter} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {FILTER_DESCRIPTIONS[filter]}
          </p>
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {logs.length === 0 ? '暂无 AI 调用日志' : '该分类暂无日志'}
            </p>
          ) : (
            <Accordion className="flex flex-col gap-1">
              {filteredLogs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AiLogView };
