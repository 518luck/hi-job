// # 思考行：AI 思考文本折叠展示，默认收起为弱化单行摘要，流式中叠加扫光动画

import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';

// 思考行属性
interface ReasoningRowProps {
  reasoning: string; // 思考全文（流式累加）
  running: boolean; // 该轮思考是否仍在流式中
}

// 拆分思考文本为非空行：逐行 trim 后过滤空白行
const splitNonEmptyLines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

// 思考行：默认折叠为单行摘要，点击或键盘切换展开全文
function ReasoningRow({ reasoning, running }: ReasoningRowProps) {
  const [expanded, setExpanded] = useState(false);
  const summaryRef = useRef<HTMLSpanElement | null>(null);

  // 摘要取行：流式中显示最后一行非空文本跟随进度，结束后显示第一行非空文本
  const lines = splitNonEmptyLines(reasoning);
  const summary = running ? (lines.at(-1) ?? '') : (lines.at(0) ?? '');

  // 流式中摘要横向滚到行尾：最新思考在行尾增长，保持最新内容可见
  useEffect(() => {
    const element = summaryRef.current;
    if (element === null || summary === '') {
      return;
    }
    element.scrollLeft = running
      ? element.scrollWidth - element.clientWidth
      : 0;
  }, [running, summary]);

  // 无思考零渲染
  if (reasoning === '') {
    return null;
  }

  // 展开态指示图标：展开向下、收起向右
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="text-xs">
      {/* // @ 折叠行：整行按钮切换展开，流式中叠加扫光动画 */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((previous) => !previous)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-1 py-1.5 text-left transition-colors hover:bg-[#27272a] focus-visible:outline-1 focus-visible:outline-[#a1a1aa]',
          running && 'hijob-reasoning-sweep',
        )}
      >
        <ChevronIcon className="size-3.5 shrink-0 text-[#71717a]" />
        <Brain className="size-3.5 shrink-0 text-[#a1a1aa]" />
        <span className="shrink-0 text-[#a1a1aa]">思考</span>
        <span
          aria-hidden
          className="mx-1 size-0.5 shrink-0 rounded-full bg-[#71717a]"
        />
        {/* // 摘要：单行截断，流式中跟随行尾增长 */}
        <span
          ref={summaryRef}
          data-follow-end={running || undefined}
          className="hijob-reasoning-summary min-w-0 flex-1 text-[#71717a]"
        >
          {summary}
        </span>
      </button>
      {/* // @ 展开正文：弱化灰色、左缩进对齐标题、保留换行 */}
      {expanded && (
        <div className="py-1 pl-9 text-[#71717a] leading-[1.7] whitespace-pre-wrap wrap-break-word">
          {reasoning}
        </div>
      )}
    </div>
  );
}

export { ReasoningRow };
