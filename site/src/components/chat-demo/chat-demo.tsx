import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { pickThinkingPhrase } from './phrases';
import { MessagePair } from './message-pair';
import { ReasoningPanel } from './reasoning-panel';
import { TypingIndicator } from './typing-indicator';
import { useScriptedStream } from './use-scripted-stream';

// 聊天演示：深色玻璃窗内循环演出「发送俏皮话 → 等待 → 思考 → 逐词回复」全系列动画
export function ChatDemo() {
  const {
    script,
    phase,
    visibleReasoningLines,
    visibleWords,
    elapsedSeconds,
    ttftMs,
    words,
    restingSeconds,
  } = useScriptedStream();
  const isThinking = phase === 'thinking';
  const isWaiting = phase === 'waiting';
  const streamingLabel = pickThinkingPhrase(Date.now());
  const reasoningSteps = script.reasoning.map((title) => ({ title }));

  // 流式滚底：思考行/正文增长时正文区贴到最新处，对齐真实产品行为
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const body = bodyRef.current;
    if (body === null) {
      return;
    }
    body.scrollTop = body.scrollHeight;
  }, [phase, visibleWords, visibleReasoningLines]);

  return (
    <div className="chat-demo mx-auto w-full max-w-[340px] select-none">
      {/* 玻璃窗体：材料属性与扩展聊天窗一致（深底 70% + 模糊 + 饱和提纯 + 受光边） */}
      <div className="overflow-hidden rounded-[12px] border border-white/10 bg-[#09090b]/70 text-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_64px_-16px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150">
        {/* 标题栏：军师招牌 + 时序统计 + 关闭 */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.04] px-3.5 py-2">
          <span className="text-[13px] font-semibold">求职军师</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/50 tabular-nums">
              {ttftMs !== null && (
                <span className="flex flex-col items-center leading-none">
                  <span className="text-foreground/30 mb-0.5 text-[9px]">ttft</span>
                  {(ttftMs / 1000).toFixed(1)}s
                </span>
              )}
              <span className="flex flex-col items-center leading-none">
                <span className="text-foreground/30 mb-0.5 text-[9px]">total</span>
                {phase === 'done'
                  ? `${restingSeconds.toFixed(1)}s`
                  : `${(elapsedSeconds + 0.4).toFixed(1)}s`}
              </span>
            </div>
            <X aria-hidden className="text-foreground/40 size-3.5" />
          </div>
        </div>
        {/* 正文区：消息对系列（气泡 → 等待/思考 → 逐词正文）；
            固定高度对齐真实产品（内容超出即滚动，而非撑高窗体） */}
        <div
          ref={bodyRef}
          className="hijob-chat-scroll h-[300px] overflow-y-auto px-3.5 py-3 text-[13px] leading-[1.8]"
        >
          <MessagePair
            userMessage={script.phrase}
            words={words}
            visibleWords={visibleWords}
            streaming={phase === 'streaming'}
          >
            {/* 等待期裸三点，首个思考行到达后换成思考面板并保持到收尾 */}
            {isWaiting ? (
              <TypingIndicator variant="bare" className="py-2" />
            ) : (
              <ReasoningPanel
                steps={reasoningSteps}
                visibleSteps={visibleReasoningLines}
                streaming={isThinking}
                open
                onOpenChange={() => {}}
                restingLabel={`思考了 ${restingSeconds} 秒`}
                streamingLabel={streamingLabel}
                elapsed={isThinking ? `${elapsedSeconds}s` : undefined}
              />
            )}
          </MessagePair>
        </div>
        {/* 操作区：场景按钮静态陈列（演示不交互） */}
        <div className="flex gap-2 border-t border-white/[0.06] bg-white/[0.04] px-3.5 py-2.5">
          {['问候', '提醒', '反馈', '回复'].map((label, i) => (
            <span
              key={label}
              className={
                i === 3
                  ? 'flex-1 rounded-none bg-foreground py-1 text-center text-[13px] text-background'
                  : 'flex-1 rounded-none border border-border py-1 text-center text-[13px] text-foreground'
              }
            >
              {label}
            </span>
          ))}
          <span className="flex-1 rounded-none border border-border py-1 text-center text-[13px] text-foreground">
            复制
          </span>
        </div>
      </div>
    </div>
  );
}
