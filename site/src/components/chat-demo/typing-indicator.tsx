'use client';

// # 输入中指示：三点交错弹跳，气泡/裸两种形态，读作「对方在场」而非噪音

import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

import { paper } from './surfaces';

// 三点动画延迟：错开相位形成波浪节奏
const DOT_DELAYS = ['-0.32s', '-0.16s', '0s'];

// 输入中指示属性
export type TypingIndicatorVariant = 'bubble' | 'bare';

// 输入中指示器：bare 为裸三点，bubble 为纸面容器包裹
export function TypingIndicator({
  variant = 'bubble',
  className,
  ...props
}: Omit<
  ComponentProps<'div'>,
  'children' | 'variant' | 'role' | 'aria-label'
> & {
  variant?: TypingIndicatorVariant; // 展示形态，默认气泡
}) {
  const dots = DOT_DELAYS.map((delay) => (
    <span
      key={delay}
      aria-hidden
      className="bg-foreground/40 size-1.5 animate-bounce rounded-full motion-reduce:animate-none"
      style={{ animationDelay: delay, animationDuration: '1.1s' }}
    />
  ));

  // 裸形态：仅三点，贴近消息流起始侧
  if (variant === 'bare') {
    return (
      <div
        data-slot="typing-indicator"
        data-variant="bare"
        role="status"
        aria-label="AI 正在输入"
        className={cn('flex gap-1', className)}
        {...props}
      >
        {dots}
      </div>
    );
  }

  return (
    <div
      data-slot="typing-indicator"
      data-variant="bubble"
      className={cn(paper, 'w-fit rounded-full px-4 py-3.5', className)}
      {...props}
    >
      <div role="status" aria-label="AI 正在输入" className="flex gap-1">
        {dots}
      </div>
    </div>
  );
}
