// # AI 日志视图：摘要列表，点击行展开实际传递参数与错误详情
import { useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type { AiLog } from '@/shared/zod';

import { useAiLogs } from '../model/use-ai-logs';

// 思考档位与调用来源的中文标签
const THINKING_MODE_LABELS: Record<AiLog['thinkingMode'], string> = {
  default: '默认',
  off: '关闭',
  low: '低',
  medium: '中',
  high: '高',
};
const SOURCE_LABELS: Record<AiLog['source'], string> = {
  greeting: '打招呼',
  reply: '回复',
  followUp: '跟进',
};

// 日志分层筛选：全部或按来源
type LogFilter = 'all' | AiLog['source'];

// 各分类的说明文字：Tab 下方展示
const FILTER_DESCRIPTIONS: Record<LogFilter, string> = {
  all: '所有来源的 AI 调用日志，按时间倒序。',
  greeting:
    '首次联系招聘者时生成的打招呼语句（工作台「生成问候」/ 聊天窗「问候」）。',
  reply: '招聘者回复后生成的下一条回复（聊天窗「回复」）。',
  followUp: '已读不回或未读时生成的提醒问候（聊天窗「提醒」）。',
};

// 时间格式化：MM-dd HH:mm:ss
const formatLogTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// 单条日志转复制文本：摘要 + 实际传递参数 + 返回内容 + 错误
const logTextOf = (log: AiLog): string => {
  const lines = [
    `${formatLogTime(log.createdAt)} ${SOURCE_LABELS[log.source]} · ${log.vendorName} · ${log.modelId} · 思考：${THINKING_MODE_LABELS[log.thinkingMode]} · ${log.ok ? '成功' : '失败'} · ${log.durationMs}ms`,
    `实际传递参数：${JSON.stringify(log.resolvedArgs, null, 2)}`,
  ];
  if (log.output !== undefined && log.output !== '') {
    lines.push(`返回内容：\n${log.output}`);
  }
  if (log.error !== undefined) {
    lines.push(`错误：${log.error}`);
  }
  return lines.join('\n');
};

// 全部日志拼接文本：逐条以分隔线隔开
const logsTextOf = (logs: AiLog[]): string =>
  logs.map(logTextOf).join('\n---\n');

// AI 日志视图的 props：onBack 返回调试页首页
interface AiLogViewProps {
  onBack: () => void;
}

// AI 日志视图：手风琴列表展开详情，提供来源分层筛选、复制全部与清空入口
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
                <AccordionItem
                  key={log.id}
                  value={String(log.id)}
                  className="rounded-lg border"
                >
                  <AccordionTrigger className="flex-col items-start gap-1 px-2 py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatLogTime(log.createdAt)}
                      </span>
                      <Badge variant={log.ok ? 'secondary' : 'destructive'}>
                        {log.ok ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div className="flex w-full items-center gap-1 text-xs">
                      <span>{SOURCE_LABELS[log.source]}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="truncate">{log.vendorName}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="truncate">{log.modelId}</span>
                    </div>
                    <div className="w-full text-xs text-muted-foreground">
                      思考：{THINKING_MODE_LABELS[log.thinkingMode]} · 耗时{' '}
                      {log.durationMs}ms
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-1 border-t px-2 pt-2">
                    {log.system !== undefined && log.system !== '' && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">
                          系统提示
                        </span>
                        <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                          {log.system}
                        </pre>
                      </>
                    )}
                    {log.prompt !== undefined && log.prompt !== '' && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">
                          用户提示
                        </span>
                        <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                          {log.prompt}
                        </pre>
                      </>
                    )}
                    {log.promptTask !== undefined && log.promptTask !== '' && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">
                          任务描述
                        </span>
                        <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                          {log.promptTask}
                        </pre>
                      </>
                    )}
                    {log.promptRequirement !== undefined &&
                      log.promptRequirement !== '' && (
                        <>
                          <span className="text-xs font-medium text-muted-foreground">
                            生成要求
                          </span>
                          <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                            {log.promptRequirement}
                          </pre>
                        </>
                      )}
                    <span className="text-xs font-medium text-muted-foreground">
                      实际传递参数
                    </span>
                    <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                      {JSON.stringify(log.resolvedArgs, null, 2)}
                    </pre>
                    {log.output !== undefined && log.output !== '' && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">
                          返回内容
                        </span>
                        <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-muted p-2 text-xs break-all whitespace-pre-wrap">
                          {log.output}
                        </pre>
                      </>
                    )}
                    {log.error !== undefined && (
                      <p className="text-xs break-all text-destructive">
                        {log.error}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AiLogView };
