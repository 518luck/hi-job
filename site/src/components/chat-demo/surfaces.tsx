'use client';

// # 表面样式集：气泡/按钮/图标与标签切换等共享类名常量及扫光、切换标签组件

import type { ComponentProps, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../lib/utils';

// 纸面气泡底：卡片边框表面，深色主题下经 token 固定为深色
export const paper = 'bg-background border border-border/60 dark:bg-popover';

// 浮层底：与纸面一致的浮起表面
export const floating = 'bg-background border border-border/60 dark:bg-popover';

// 静态输入底：弱前景色叠层
export const field = 'bg-foreground/[0.04] dark:bg-foreground/[0.06]';

// 可交互输入底：悬停时叠层加深
export const fieldInteractive =
  'bg-foreground/[0.04] transition-colors hover:bg-foreground/[0.07] dark:bg-foreground/[0.06] dark:hover:bg-foreground/[0.09]';

// 按压动效：短促缩放反馈
export const pressable =
  'transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] motion-reduce:transition-none';

// 幽灵图标按钮：透明底、悬停显底、焦点可见环
export const ghostButton =
  'flex items-center justify-center rounded-full text-foreground/45 outline-none transition-[background-color,color,scale] duration-150 hover:bg-foreground/[0.06] hover:text-foreground/90 active:scale-[0.96] focus-visible:ring-1 focus-visible:ring-foreground/20 motion-reduce:transition-none dark:hover:bg-foreground/[0.09]';

// 墨色按钮：前景色实底主按钮
export const inkButton =
  'bg-foreground text-background transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.96] motion-reduce:transition-none';

// 图标切换双槽基类：两枚图标叠放同格做过渡
export const iconSwap =
  '[grid-area:1/1] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none';

// 图标切换入场态
export const iconSwapIn = 'scale-100 opacity-100 blur-none';

// 图标切换出场态：缩小淡出并模糊
export const iconSwapOut = 'scale-[0.25] opacity-0 blur-[4px]';

// 标签切换双槽基类：两段文案叠放同格做过渡
export const labelSwap =
  'col-start-1 row-start-1 flex w-max items-center gap-1.5 leading-none transition-[opacity,filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none';

// 标签切换入场态
export const labelSwapIn = 'opacity-100 blur-none';

// 标签切换出场态：淡出模糊且不可交互
export const labelSwapOut =
  'pointer-events-none select-none opacity-0 blur-[2px]';

// 折叠面板高度动画：依赖 --collapsible-panel-height 变量过渡
export const collapsePanel =
  'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none';

// 实时高亮色：流式新内容用
export const live = 'text-blue-500 dark:text-blue-400';

// 等宽小号文本：计时与数字展示
export const mono = 'font-mono text-[11px] tracking-tight';

// 扫光标签：active 时叠加扫光动画（等待文案等）
export function ShimmerLabel({
  active = true,
  className,
  ...props
}: ComponentProps<'span'> & { active?: boolean }) {
  return (
    <span
      className={cn(active && 'shimmer motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

// 代码横向滚动区：保留空白的行在限定盒内自行滚动触达被裁剪内容
export const codeScroll = 'overflow-x-auto';

// 代码整块表面：承载全部行；min-width:100% 按可视宽度解析，逐行设置会让非最长行的背景在折行处截断
export const codeSurface = 'w-max min-w-full';

// 切换标签：两层文案按 active 槽位淡入淡出，容器宽度经测量跟随活动层
export function SwapLabel({
  active,
  children,
  className,
}: {
  active: 0 | 1;
  children: [ReactNode, ReactNode];
  className?: string;
}) {
  const layers = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const activeLayer = layers[active];
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const target = activeLayer?.current;
    if (!target) return undefined;
    const measure = () =>
      setWidth(Math.ceil(target.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeLayer]);

  return (
    <span
      style={width === null ? undefined : { width }}
      className={cn(
        'grid overflow-x-clip transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        className,
      )}
    >
      {children.map((layer, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 双层标签按槽位渲染（children 为二元组），槽位即身份、永不重排
          key={index}
          ref={layers[index]}
          aria-hidden={active !== index}
          className={cn(
            labelSwap,
            active === index ? labelSwapIn : labelSwapOut,
          )}
        >
          {layer}
        </span>
      ))}
    </span>
  );
}
