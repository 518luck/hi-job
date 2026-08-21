'use client';

// # 消息对组件：用户侧气泡 + AI 流式逐词显现的正文与悬停复制/重新生成操作

import { CopyIcon, RefreshCwIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { take } from './range';
import { ghostButton, paper } from './surfaces';

// 消息对属性
export interface MessagePairProps
  extends Omit<ComponentProps<'div'>, 'children'> {
  userMessage: string; // 用户侧消息文本
  words: readonly string[]; // AI 正文按词拆分后的全量词序列
  visibleWords: number; // 当前可见词数，驱动逐词显现进度
  streaming: boolean; // 是否仍在流式生成中（尾随光标与新鲜词高亮）
  variant?: 'bubble' | 'flat'; // 用户消息形态：气泡或纯文本右对齐
  onCopy?: () => void; // 悬停复制回调：复制 AI 正文全文
  onRegenerate?: () => void; // 悬停重新生成回调：重跑当前场景
  children?: ReactNode; // 插在用户气泡与 AI 正文之间的内容（如思考面板），保持「请求 → 思考 → 正文」顺序
}

// 消息对：上方用户消息、中间可选插槽、下方 AI 流式正文与悬停操作按钮
export function MessagePair({
  userMessage,
  words,
  visibleWords,
  streaming,
  variant = 'bubble',
  onCopy,
  onRegenerate,
  children,
  className,
  ...props
}: MessagePairProps) {
  const shown = take(words, visibleWords);

  return (
    <div
      data-slot="message-pair"
      className={cn('flex w-full max-w-sm flex-col gap-5', className)}
      {...props}
    >
      <p
        className={cn(
          'max-w-[85%] self-end text-[13px]',
          variant === 'bubble'
            ? // 圆角用 px 显式值：窗内 @theme 已把圆角刻度清零（直角风格），rounded-2xl 会静默失效
              cn(paper, 'rounded-[16px] px-3.5 py-2')
            : 'text-foreground/90 text-end',
        )}
      >
        {userMessage}
      </p>
      {children}
      <div className="group/message flex flex-col items-start">
        {/* // 词序列：词文本自带原尾随空白，pre-wrap 还原空格与换行，break-all 防长串溢出 */}
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-all">
          {shown.map((word, index) => {
            const fresh = streaming && shown.length - 1 - index < 2;

            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 流式词追加只增不重排且会重复；词文本含尾随空白随 chunk 增长，索引才是稳定身份（文本 key 会重挂重放淡入）
                key={index}
                className="fade-in animate-in fill-mode-both duration-500 motion-reduce:animate-none"
              >
                <span
                  className={cn(
                    'transition-colors duration-700 motion-reduce:transition-none',
                    fresh && 'text-blue-500 dark:text-blue-400',
                  )}
                >
                  {word}
                </span>
              </span>
            );
          })}
          {streaming && shown.length > 0 && (
            <span
              aria-hidden
              className="-mb-0.5 ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-blue-500 motion-reduce:animate-none dark:bg-blue-400"
            />
          )}
        </p>
        {/* // @ 悬停操作：复制与重新生成，聚焦/悬停消息时浮现；正文未到时隐藏（思考阶段无内容可操作） */}
        {shown.length > 0 && (
          <div className="flex items-center gap-1 pt-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 motion-reduce:transition-none">
            <button
              type="button"
              aria-label="复制回复"
              onClick={onCopy}
              className={cn(ghostButton, 'size-7')}
            >
              <CopyIcon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="重新生成"
              onClick={onRegenerate}
              className={cn(ghostButton, 'size-7')}
            >
              <RefreshCwIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
