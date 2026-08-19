'use client';

// # 生成加载指示：九宫格呼吸动画 + 扫光等待文案

import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { ShimmerLabel } from './surfaces';

export type GenerationLoaderVariant = 'dots' | 'squares' | 'rounded';

// 生成加载指示属性
export interface GenerationLoaderProps
  extends Omit<ComponentProps<'div'>, 'children'> {
  label: string; // 等待文案（扫光展示）
  tick: number; // 动画节拍数，驱动九宫格高亮轮转
  variant?: GenerationLoaderVariant; // 单元形状变体，默认圆点
}

// 九宫格单元形状：按加载变体取圆点/方角/圆角
const CELL_SHAPES: Record<GenerationLoaderVariant, string> = {
  dots: 'rounded-full',
  squares: 'rounded-[1px]',
  rounded: 'rounded-[3px]',
};

// 生成加载指示器：九宫格按 tick 轮转高亮，下方文案叠加扫光
export function GenerationLoader({
  label,
  tick,
  variant = 'dots',
  className,
  ...props
}: GenerationLoaderProps) {
  const pixelOffset = Math.floor(tick / 3);

  return (
    <div
      data-slot="generation-loader"
      className={cn('flex flex-col items-center gap-4', className)}
      {...props}
    >
      <div aria-hidden className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }, (_, index) => {
          const active = (index * 2 + pixelOffset) % 9 < 3;

          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: 九宫格固定槽位动画，槽位即身份、永不重排
              key={index}
              className={cn(
                'bg-foreground size-2 transition-opacity duration-300 motion-reduce:transition-none',
                CELL_SHAPES[variant],
                active ? 'opacity-90' : 'opacity-15',
              )}
            />
          );
        })}
      </div>
      <ShimmerLabel className="text-foreground/55 relative inline-block text-[13px]">
        {label}
      </ShimmerLabel>
    </div>
  );
}
