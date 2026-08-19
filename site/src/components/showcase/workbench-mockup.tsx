import { ChevronDown, Settings2 } from 'lucide-react';

import { cn } from '../../lib/utils';

// 单行配置项：标签 + 下拉样式的取值
interface ConfigRow {
  label: string;
  value: string;
}

// 示例配置：厂商 / 模型 / 思考模式三档
const CONFIG_ROWS: readonly ConfigRow[] = [
  { label: 'AI 厂商', value: '小米 MiMo' },
  { label: '模型', value: 'MiMo-V2-Pro' },
  { label: '思考模式', value: '中（reasoning: medium）' },
];

// 工作台 mockup：AI 生成设置 + 当前会话上下文卡
export function WorkbenchMockup() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <Settings2 aria-hidden className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          工作台 · AI 设置
        </span>
      </div>
      <div className="space-y-2.5 p-4">
        {CONFIG_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              {row.label}
            </span>
            {/* 取值呈现为只读下拉：右侧箭头示意可切换 */}
            <div className="flex min-w-0 flex-1 items-center justify-between rounded-lg border bg-background px-2.5 py-1.5">
              <span className="truncate text-xs text-foreground">
                {row.value}
              </span>
              <ChevronDown aria-hidden className="size-3 text-muted-foreground" />
            </div>
          </div>
        ))}
        {/* 当前会话卡：军师生成时读取的上下文 */}
        <div className={cn('mt-3 rounded-lg border bg-muted/50 p-3')}>
          <p className="text-[11px] text-muted-foreground">当前会话</p>
          <p className="mt-1 truncate text-xs font-medium text-foreground">
            张女士 · 高级全栈开发工程师 · 上海某科技
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            聊天记录 12 条 · 最后消息 2 分钟前
          </p>
        </div>
      </div>
    </div>
  );
}
