// # 流式节拍驱动：正文词切分与匀速节拍 Hook，驱动消息流逐词显现与思考计时

import { useEffect, useMemo, useState } from 'react';

import type { Segment } from '../ui/elements/streaming-text';

// 节拍默认间隔：约每 150ms 显现一个词
const DEFAULT_TICK_INTERVAL_MS = 150;

// 词元切分：1-2 个汉字带前后并入的标点（弯引号/省略号/破折号与中文/全角标点），或不含空白与汉字的连续串（ASCII 词连同其相邻标点）
const WORD_SEGMENT_PATTERN =
  /[\u2013-\u2026\u3001-\u303f\uff00-\uffef]?[\u4e00-\u9fff]{1,2}[\u2013-\u2026\u3001-\u303f\uff00-\uffef]*|[^\s\u4e00-\u9fff]+/gu;

// useStreamTick 参数
interface UseStreamTickOptions {
  active: boolean; // 是否正在计拍（失活即暂停并清零）
  intervalMs?: number; // 节拍间隔毫秒数
}

// useStreamTick 返回
interface UseStreamTickResult {
  tick: number; // 节拍计数，active 期间每 intervalMs 递增一次
  elapsedSeconds: number; // 自最近一次激活起累计的秒数
}

// 正文切词：中文按 2 字符成词、标点并入前词，其余按非空白连续串取词
const splitWordSegments = (text: string): Segment[] =>
  text
    .match(WORD_SEGMENT_PATTERN)
    ?.map((segmentText) => ({ text: segmentText })) ?? [];

// 正文词切分 Hook：流式文本到逐词显现 Segment 序列的纯映射
const useWordSegments = (text: string): Segment[] =>
  useMemo(() => splitWordSegments(text), [text]);

// 流式节拍 Hook：active 时按 intervalMs 递增计数，失活或卸载时清理并清零
const useStreamTick = ({
  active,
  intervalMs = DEFAULT_TICK_INTERVAL_MS,
}: UseStreamTickOptions): UseStreamTickResult => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      setTick(0);
      return;
    }
    const timer = setInterval(() => {
      setTick((previous) => previous + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return { tick, elapsedSeconds: Math.floor((tick * intervalMs) / 1000) };
};

export type { UseStreamTickOptions, UseStreamTickResult };
export { useStreamTick, useWordSegments };
