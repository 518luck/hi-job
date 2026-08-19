'use client';

// # 流式正文：按词逐步显现的正文段落，支持等宽片段标记

import { type ComponentProps, useMemo } from 'react';

import { cn } from '@/shared/lib/cn';

import { take } from './range';

// 正文片段
export interface Segment {
  text: string; // 片段文本，按空格拆词
  mono?: boolean; // 是否等宽样式标记（如代码片段）
}

// 流式正文：segments 拆词后按 count 逐词显现，最新词高亮并带尾随光标
export function StreamingText({
  segments,
  count,
  streaming,
  className,
  ...props
}: Omit<
  ComponentProps<'p'>,
  'children' | 'segments' | 'count' | 'streaming'
> & {
  segments: Segment[];
  count: number;
  streaming: boolean;
}) {
  const words = useMemo(
    () =>
      segments.flatMap((segment) =>
        segment.text
          .split(' ')
          .map((word) => ({ word, mono: segment.mono ?? false })),
      ),
    [segments],
  );
  const shown = take(words, count);

  return (
    <p
      data-slot="streaming-text"
      className={cn(
        'max-w-sm text-[13px] leading-relaxed text-pretty',
        className,
      )}
      {...props}
    >
      {shown.map(({ word, mono: isMono }, i) => {
        const fresh = streaming && shown.length - 1 - i < 2;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 流式词追加只增不重排，且词会重复无法单独作 key，索引即稳定身份
            key={`${word}-${i}`}
            className="fade-in animate-in fill-mode-both duration-500 motion-reduce:animate-none"
          >
            <span
              className={cn(
                'transition-colors duration-700 motion-reduce:transition-none',
                fresh && 'text-blue-500 dark:text-blue-400',
                isMono &&
                  'bg-foreground/[0.06] rounded-md px-1.5 py-0.5 font-mono text-[0.85em]',
              )}
            >
              {word}
            </span>{' '}
          </span>
        );
      })}
      {streaming && shown.length > 0 && (
        <span
          aria-hidden
          className="-mb-0.5 ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400"
        />
      )}
    </p>
  );
}
