// # 流式驱动：正文词切分与思考计时 Hook

import { useEffect, useMemo, useState } from 'react';

import { ELAPSED_INTERVAL_MS } from '../config/stream-driver';
import type { Segment } from '../ui/elements/streaming-text';

// 词元切分：1-2 个汉字带前后并入的标点（弯引号/省略号/破折号与中文/全角标点），或不含空白与汉字的连续串（ASCII 词连同其相邻标点）；
// 每词吞并其尾随空白（空格/换行/空行），渲染端按 pre-wrap 还原，词间不再注入分隔符
const WORD_SEGMENT_PATTERN =
  /[\u2013-\u2026\u3001-\u303f\uff00-\uffef]?[\u4e00-\u9fff]{1,2}[\u2013-\u2026\u3001-\u303f\uff00-\uffef]*\s*|[^\s\u4e00-\u9fff]+\s*/gu;

// useElapsedSeconds 参数
interface UseElapsedSecondsOptions {
  active: boolean; // 是否正在计时（失活停表保持读数，再激活清零重计）
}

// useElapsedSeconds 返回
interface UseElapsedSecondsResult {
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

// 思考计时 Hook：active 时每秒递增；失活停表保持读数，重新激活视为新一轮清零重计
const useElapsedSeconds = ({
  active,
}: UseElapsedSecondsOptions): UseElapsedSecondsResult => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, ELAPSED_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active]);

  return { elapsedSeconds };
};

export type { UseElapsedSecondsOptions, UseElapsedSecondsResult };
export { useElapsedSeconds, useWordSegments };
