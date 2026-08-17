// # AI 日志文本格式化：时间显示与复制文本拼接
import type { AiLog } from '@/shared/zod';

import { SOURCE_LABELS, THINKING_MODE_LABELS } from '../config/log-labels';

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

export { formatLogTime, logsTextOf, logTextOf };
