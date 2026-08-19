'use client';

// # 循环省略号：三点依次浮现后复位（. .. ... 循环），占位恒定宽度不抖动

import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

// 循环省略号：纯装饰性动画，对读屏隐藏
export function Ellipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="ellipsis"
      aria-hidden
      className={cn('text-foreground/55 inline leading-none', className)}
      {...props}
    >
      .<span className="hijob-ellipsis-2nd">.</span>
      <span className="hijob-ellipsis-3rd">.</span>
    </span>
  );
}
