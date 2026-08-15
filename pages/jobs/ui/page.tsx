// # 职位列表页：最近记录的职位与 AI 打招呼
import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

import { useJds } from '../model/use-jds';
import { useVendors } from '../model/use-vendors';
import { JdCard } from './jd-card';

// 职位列表页：顶部选择生成用的厂商与模型，卡片流展示最近记录的职位
function JobsPage() {
  const { jds, loading } = useJds();
  const { vendors } = useVendors();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);

  // 生效的厂商与模型：未选择或选择失效时回退到第一个
  const vendor =
    vendors.find((item) => item.vendorId === vendorId) ?? vendors[0];
  const activeModelId =
    vendor?.models.find((model) => model === modelId) ?? vendor?.models[0];

  // 切换厂商时清空模型选择，由回退逻辑自动选中该厂商第一个模型
  const handleVendorChange = (next: string | null) => {
    setVendorId(next);
    setModelId(null);
  };

  // 渲染厂商/模型选择器：未配置厂商时给出引导提示
  const renderVendorPicker = () => {
    if (vendors.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有配置 AI 厂商：去「AI 厂商」页添加后可用 AI 打招呼
        </p>
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
          onValueChange={handleVendorChange}
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
          onValueChange={setModelId}
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
      <h2 className="text-base font-medium">职位</h2>
      {renderVendorPicker()}
      {renderList()}
    </div>
  );
}

export { JobsPage };
