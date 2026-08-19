'use client';

// # 思考面板：AI 推理步骤折叠列表，流式中标题扫光并逐步显现

import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';

import { take } from './range';
import { collapsePanel, mono, ShimmerLabel, SwapLabel } from './surfaces';

// 推理步骤
export interface ReasoningStep {
  title: string; // 步骤标题
  body?: string; // 步骤正文（无正文的行可省略）
}

// 思考面板属性
export interface ReasoningPanelProps {
  steps: ReasoningStep[]; // 全量推理步骤
  visibleSteps: number; // 当前可见步骤数，驱动逐步显现
  streaming: boolean; // 是否仍在流式思考中
  open: boolean; // 折叠展开状态（受控）
  onOpenChange: (open: boolean) => void; // 展开状态变更回调
  restingLabel: string; // 思考结束后的折叠态标签文案
  elapsed?: string; // 已耗时文案，流式中展示在标题旁
  streamingLabel?: string; // 流式中的标题文案，默认「思考中」，可由调用方按思考时长递进切换
  className?: string; // 追加到根元素的类名
}

// 思考面板：折叠触发器扫光切换「思考中/结束态」，展开后按步骤列表逐条显现
export function ReasoningPanel({
  steps,
  visibleSteps,
  streaming,
  open,
  onOpenChange,
  restingLabel,
  elapsed,
  streamingLabel = '思考中',
  className,
}: ReasoningPanelProps) {
  const shown = take(steps, visibleSteps);

  // 时间线滚动区：流式中贴底跟随最新步骤（与主窗体滚底行为一致）
  const timelineRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline === null || !streaming || steps.length === 0) {
      return;
    }
    timeline.scrollTop = timeline.scrollHeight;
  }, [steps, streaming]);

  return (
    <Collapsible
      data-slot="reasoning-panel"
      open={open}
      onOpenChange={onOpenChange}
      className={cn('w-full max-w-sm', className)}
    >
      <CollapsibleTrigger className="group/trigger text-foreground/55 hover:text-foreground/90 flex items-center gap-1.5 py-1 text-[13px] transition-[color,scale] outline-none active:scale-[0.98]">
        <SwapLabel active={streaming ? 0 : 1} className="text-start">
          {/* biome-ignore lint/complexity/noUselessFragments: 误报——SwapLabel 的 children 契约是二元组 [ReactNode, ReactNode]，Fragment 把多元素收拢为一个槽位；删除后元组越界，string 会被分配给 undefined 报 TS 错，规则无法感知该类型契约 */}
          <>
            <ShimmerLabel
              active={streaming}
              className="relative inline-block leading-none"
            >
              {streamingLabel}
            </ShimmerLabel>
            {elapsed !== undefined && (
              <span className={cn(mono, 'text-foreground/30 tabular-nums')}>
                {elapsed}
              </span>
            )}
          </>
          {restingLabel}
        </SwapLabel>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-60 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-open/trigger:rotate-180 group-data-panel-open/trigger:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn(collapsePanel, 'outline-none')}>
        {/* // 时间线滚动区：高度封顶超出滚动（沿用窗内深色细滚动条），避免长思考无限撑高正文区 */}
        <div
          ref={timelineRef}
          className="hijob-chat-scroll max-h-[180px] overflow-y-auto"
        >
          {/* // 引导线：贯穿全部步骤圆点的纵向细线，随内容同高滚动 */}
          <div className="relative">
            <span
              aria-hidden
              className="absolute top-[21px] bottom-[14px] left-[2px] w-px bg-foreground/15"
            />
            <ol className="flex flex-col gap-4 pt-3 pb-1">
              {shown.map((step, i) => {
                const active = streaming && i === shown.length - 1;
                return (
                  <li
                    // biome-ignore lint/suspicious/noArrayIndexKey: 步骤列表只前缀追加不重排，且末步标题随流式增长，索引才是稳定身份（文本 key 会重挂重放入场动画）
                    key={i}
                    className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both flex gap-3 duration-300"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-[7px] size-[5px] shrink-0 rounded-full transition-colors duration-300',
                        active
                          ? 'animate-pulse bg-blue-500 dark:bg-blue-400'
                          : 'bg-foreground/20',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <p className="text-muted-foreground text-[13px] font-medium">
                        {step.title}
                      </p>
                      {step.body !== undefined && step.body !== '' && (
                        <p className="text-foreground/50 mt-0.5 text-[13px] leading-relaxed break-words">
                          {step.body}
                        </p>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
