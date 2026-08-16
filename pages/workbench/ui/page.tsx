// # 工作台页：最近记录的职位与 AI 打招呼
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
import type { NavKey } from '@/widgets/nav-bar';

import { useChatSession } from '../model/use-chat-session';
import { useJds } from '../model/use-jds';
import { usePersistedVendorSelection } from '../model/use-persisted-vendor-selection';
import { useVendors } from '../model/use-vendors';
import { ChatSessionCard } from './chat-session-card';
import { JdCard } from './jd-card';

// 工作台页的 props：onNavigate 用于跳转到其他导航页
interface WorkbenchPageProps {
  onNavigate: (key: NavKey) => void;
}

// 工作台页：顶部选择生成用的厂商与模型，卡片流展示最近记录的职位
function WorkbenchPage({ onNavigate }: WorkbenchPageProps) {
  const { jds, loading } = useJds();
  const { vendors } = useVendors();
  const { vendorId, modelId, selectVendor, selectModel } =
    usePersistedVendorSelection();
  const { view: chatView, toggleFailed } = useChatSession();

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
      </div>
    );
  };

  // 渲染职位列表：读取中与空态提示
  const renderList = () => {
    if (loading) {
      return <p className="text-xs text-muted-foreground">读取中…</p>;
    }
    if (jds.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有记录的职位：在招聘网站打开职位详情自动记录
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {jds.map((jd) => (
          <JdCard
            key={jd.jobId}
            jd={jd}
            vendor={vendor}
            modelId={activeModelId}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">工作台</h2>
      {renderVendorPicker()}
      {chatView !== undefined && (
        <ChatSessionCard
          session={chatView.session}
          jd={chatView.jd}
          failed={chatView.failed}
          onToggleFailed={() => {
            void toggleFailed();
          }}
        />
      )}
      {renderList()}
    </div>
  );
}

export { WorkbenchPage };
