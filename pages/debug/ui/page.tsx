import { Switch } from '@/shared/ui/switch';

import { useDebugSettings } from '../model/use-debug-settings';

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

// 调试页：控制聊天页/职位页探测按钮的显示开关
function DebugPage() {
  const { settings, setChatProbeEnabled, setJdProbeEnabled } =
    useDebugSettings();

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
          title="职位页探测按钮"
          description="在职位页右下角显示「探测职位数据」悬浮按钮"
          checked={settings.jdProbeEnabled}
          onCheckedChange={setJdProbeEnabled}
        />
      </div>
    </div>
  );
}

export { DebugPage };
