import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Icons } from '@/shared/ui/icons';
import { Switch } from '@/shared/ui/switch';

import { useDebugSettings } from '../model/use-debug-settings';
import { AiLogView } from './ai-log-view';
import { PageLogView } from './page-log-view';

// 探测开关行的 props
interface ToggleRowProps {
  title: string; // 开关名称（页面名）
  checked: boolean; // 当前开关状态
  onCheckedChange: (enabled: boolean) => void; // 切换回调
}

// 探测开关行：页面名 + 滑动开关，行间由外层 hairline 分隔
function ToggleRow({ title, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{title}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}

// 日志入口行的 props
interface LogEntryRowProps {
  icon: LucideIcon; // 入口图标
  title: string; // 入口名称
  description: string; // 入口说明
  onOpen: () => void; // 点击进入对应日志视图
}

// 日志入口行：无边框行，由外层容器统一夹边框与行分隔线
function LogEntryRow({
  icon: Icon,
  title,
  description,
  onOpen,
}: LogEntryRowProps) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/50"
      onClick={onOpen}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
      </span>
      <Icons.chevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

// 分组眉标的 props
interface SectionLabelProps {
  children: string; // 眉标文本
}

// 分组眉标：等宽字体宽字距小标签，呼应调试页的诊断台气质
function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
      {children}
    </p>
  );
}

// 调试页视图：首页（开关 + 日志入口）与各日志列表
type DebugView = 'home' | 'aiLog' | 'pageLog';

// 调试页：页面探测开关的安静清单 + 日志入口的控制台菜单
function DebugPage() {
  const {
    settings,
    setChatProbeEnabled,
    setJdProbeEnabled,
    setDetailProbeEnabled,
  } = useDebugSettings();
  const [view, setView] = useState<DebugView>('home');

  if (view === 'aiLog') {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <AiLogView onBack={() => setView('home')} />
      </div>
    );
  }

  if (view === 'pageLog') {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <PageLogView onBack={() => setView('home')} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">调试</h2>
        <p className="text-xs text-muted-foreground">诊断工具与运行日志</p>
      </div>
      <section className="flex flex-col gap-2">
        <SectionLabel>页面探测</SectionLabel>
        <p className="text-xs text-muted-foreground">
          开启后，对应页面右下角显示「探测」悬浮按钮
        </p>
        <div className="divide-y divide-border border-y border-border">
          <ToggleRow
            title="聊天页"
            checked={settings.chatProbeEnabled}
            onCheckedChange={setChatProbeEnabled}
          />
          <ToggleRow
            title="职位列表页"
            checked={settings.jdProbeEnabled}
            onCheckedChange={setJdProbeEnabled}
          />
          <ToggleRow
            title="职位详情页"
            checked={settings.detailProbeEnabled}
            onCheckedChange={setDetailProbeEnabled}
          />
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <SectionLabel>日志</SectionLabel>
        <div className="divide-y divide-border border border-border">
          <LogEntryRow
            icon={Icons.aiLog}
            title="AI 日志"
            description="打招呼、回复等 AI 调用记录"
            onOpen={() => setView('aiLog')}
          />
          <LogEntryRow
            icon={Icons.history}
            title="页面采集日志"
            description="当前 BOSS 页面的采集与同步日志"
            onOpen={() => setView('pageLog')}
          />
        </div>
      </section>
    </div>
  );
}

export { DebugPage };
