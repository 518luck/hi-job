import { useCallback, useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';

// 页面采集日志行：从隐藏 DOM 条目解析出的时间与内容
interface PageLogRow {
  time: string; // HH:MM:SS 时间戳文本
  text: string; // 日志内容
}

// 解析单条日志行：剥离 [HH:MM:SS] 前缀，解析失败时整行作为内容
const rowOfLine = (line: string): PageLogRow => {
  const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s?(.*)$/);
  if (match === null) {
    return { time: '', text: line };
  }
  return { time: match[1] ?? '', text: match[2] ?? '' };
};

// 调试页页面采集日志：进入视图拉取一次，手动刷新重拉（不轮询）
const usePageDebugLogs = (): {
  rows: PageLogRow[];
  refresh: () => Promise<void>;
} => {
  const [rows, setRows] = useState<PageLogRow[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    const lines = await sendMessage('getPageDebugLogs', undefined).catch(
      () => [],
    );
    // 最新在前：调试时最关心最近的日志
    setRows(lines.map(rowOfLine).reverse());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, refresh };
};

export type { PageLogRow };
export { usePageDebugLogs };
