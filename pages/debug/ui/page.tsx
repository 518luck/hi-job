import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Icons } from '@/shared/ui/icons';
import { Switch } from '@/shared/ui/switch';

import { useDebugSettings } from '../model/use-debug-settings';
import { AiLogView } from './ai-log-view';
import { PageLogView } from './page-log-view';

// 单个调试开关行的 props
interface ToggleRowProps {
  title: string; // 开关名称
  description: string; // 开关说明
  checked: boolean; // 当前开关状态
  onCheckedChange: (enabled: boolean) => void; // 切换回调
}

// 单个调试开关行：标题 + 说明 + 滑动开关
function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}

// 日志入口卡片行的 props
interface LogEntryRowProps {
  icon: LucideIcon; // 入口图标
  title: string; // 入口名称
  description: string; // 入口说明
  onOpen: () => void; // 点击进入对应日志视图
}

// 日志入口卡片行：与上方开关行同款样式，整行可点进入对应日志视图
function LogEntryRow({
  icon: Icon,
  title,
  description,
  onOpen,
}: LogEntryRowProps) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      onClick={onOpen}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
      </span>
      <Icons.chevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

// 调试页视图：首页（开关 + 日志入口）与各日志列表
type DebugView = 'home' | 'aiLog' | 'pageLog';

// 调试页：控制探测按钮开关，日志入口按钮后续扩展程序日志
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
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h2 className="text-base font-medium">调试</h2>
      <div className="flex flex-col gap-2">
        <ToggleRow
          title="聊天页探测按钮"
          description="在聊天页右下角显示「探测聊天数据」悬浮按钮"
          checked={settings.chatProbeEnabled}
          onCheckedChange={setChatProbeEnabled}
        />
        <ToggleRow
          title="职位列表页探测按钮"
          description="在职位列表页右下角显示「探测职位数据」悬浮按钮"
          checked={settings.jdProbeEnabled}
          onCheckedChange={setJdProbeEnabled}
        />
        <ToggleRow
          title="职位详情页探测按钮"
          description="在职位详情页右下角显示「探测职位数据」悬浮按钮"
          checked={settings.detailProbeEnabled}
          onCheckedChange={setDetailProbeEnabled}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">日志</h3>
        <LogEntryRow
          icon={Icons.aiLog}
          title="AI 日志"
          description="查看打招呼、回复等 AI 调用记录"
          onOpen={() => setView('aiLog')}
        />
        <LogEntryRow
          icon={Icons.history}
          title="页面采集日志"
          description="查看当前 BOSS 页面的采集与同步运行日志"
          onOpen={() => setView('pageLog')}
        />
      </div>
    </div>
  );
}

export { DebugPage };
