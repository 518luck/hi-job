// # 工作台页：AI 生成设置（厂商/模型/思考模式选择）
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import type { NavKey } from '@/widgets/nav-bar';

import { useAiPreference } from '../model/use-ai-preference';
import { useHasBlockedCompanies } from '../model/use-has-blocked-companies';
import { useVendors } from '../model/use-vendors';
import { CurrentSessionCard } from './current-session-card';
import { ResumeUpload } from './resume-upload';

// 思考模式档位选项：文案说明各档对生成参数的影响
const THINKING_MODE_OPTIONS = [
  { value: 'default', label: '思考：默认（不传任何参数）' },
  { value: 'off', label: '思考：关闭（显式传禁用参数）' },
  { value: 'low', label: '思考：低（传 reasoning: low）' },
  { value: 'medium', label: '思考：中（传 reasoning: medium）' },
  { value: 'high', label: '思考：高（传 reasoning: high）' },
] as const;

// 工作台页的 props：onNavigate 用于跳转到其他导航页，onOpenBlockedCompanies 跳到设置页屏蔽公司区块
interface WorkbenchPageProps {
  onNavigate: (key: NavKey) => void;
  onOpenBlockedCompanies: () => void;
}

// 工作台页：配置 AI 生成用的厂商、模型与思考模式
function WorkbenchPage({
  onNavigate,
  onOpenBlockedCompanies,
}: WorkbenchPageProps) {
  const { vendors } = useVendors();
  const hasBlockedCompanies = useHasBlockedCompanies();
  const {
    vendorId,
    modelId,
    thinkingMode,
    autoGreetOnGoChat,
    autoSendGreeting,
    selectVendor,
    selectModel,
    setThinkingMode,
    setAutoGreetOnGoChat,
    setAutoSendGreeting,
  } = useAiPreference();

  // 生效的厂商与模型：未选择或选择失效时回退到第一个
  const vendor =
    vendors.find((item) => item.vendorId === vendorId) ?? vendors[0];
  const activeModelId =
    vendor?.models.find((model) => model === modelId) ?? vendor?.models[0];

  // 渲染厂商/模型选择器：未配置厂商时给出引导提示
  const renderVendorPicker = () => {
    if (vendors.length === 0) {
      return (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            未配置 AI，生成回答需要先配置AI
          </p>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onNavigate('aiVendors')}
          >
            <Icons.aiVendors data-icon="inline-start" />
            <span>去配置</span>
          </Button>
        </div>
      );
    }
    const vendorItems = vendors.map((item) => ({
      value: item.vendorId,
      label: item.name,
    }));
    const modelItems = (vendor?.models ?? []).map((model) => ({
      value: model,
      label: model,
    }));
    return (
      <div className="grid grid-cols-2 gap-2">
        <Select
          items={vendorItems}
          value={vendor?.vendorId ?? null}
          onValueChange={selectVendor}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {vendorItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={modelItems}
          value={activeModelId ?? null}
          onValueChange={selectModel}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {modelItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="col-span-2">
          <Select
            items={THINKING_MODE_OPTIONS}
            value={thinkingMode}
            onValueChange={(value) => {
              if (value !== null) {
                void setThinkingMode(value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {THINKING_MODE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">工作台</h2>
      <CurrentSessionCard />
      {renderVendorPicker()}
      {/* // @ 去沟通自动化：控制「去沟通」落到聊天页后的自动问候生成与自动发送 */}
      <div className="divide-y divide-border border border-border">
        <SwitchRow
          title="去沟通后自动生成问候"
          description="从侧边栏「去沟通」进入聊天页后，自动生成 AI 问候并填入输入框"
          checked={autoGreetOnGoChat}
          disabled={false}
          onCheckedChange={setAutoGreetOnGoChat}
        />
        <SwitchRow
          title="生成后自动发送"
          description="问候生成完成后自动点击发送；关闭则填入输入框由你确认后手动发"
          checked={autoSendGreeting && autoGreetOnGoChat}
          disabled={!autoGreetOnGoChat}
          onCheckedChange={setAutoSendGreeting}
        />
      </div>
      <ResumeUpload />
      {/* 屏蔽公司引导入口：仅在名单为空时展示，已配置则不再指引 */}
      {!hasBlockedCompanies && (
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring/50"
          onClick={onOpenBlockedCompanies}
        >
          <span className="flex items-center gap-3">
            <Icons.company className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium">屏蔽公司</span>
            </span>
          </span>
          <Icons.chevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// 自动化开关行的 props
interface SwitchRowProps {
  title: string; // 开关名称
  description: string; // 开关作用说明
  checked: boolean; // 当前开关状态
  disabled: boolean; // 是否禁用（依赖的上游开关未开时）
  onCheckedChange: (enabled: boolean) => void; // 切换回调
}

// 自动化开关行：名称与说明在左、滑动开关在右，行间由外层 hairline 分隔
function SwitchRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}

export { WorkbenchPage };
