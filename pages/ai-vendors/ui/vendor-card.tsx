// # 厂商配置卡片：名称、API 格式、地址与模型列表，编辑/删除入口
import type { AiVendorRecord } from '@/infra/storage';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Icons } from '@/shared/ui/icons';

// 厂商卡片的 props：操作回调上抛给页面统一处理
interface VendorCardProps {
  vendor: AiVendorRecord;
  onEdit: (vendor: AiVendorRecord) => void;
  onRemove: (vendor: AiVendorRecord) => void;
}

// API 格式的展示文案
const apiFormatLabel = (format: AiVendorRecord['apiFormat']): string =>
  format === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容';

// 厂商配置卡片：聚合该厂商的全部配置信息与操作按钮
function VendorCard({ vendor, onEdit, onRemove }: VendorCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span className="truncate">{vendor.name}</span>
          <Badge variant="secondary" className="shrink-0">
            {apiFormatLabel(vendor.apiFormat)}
          </Badge>
        </CardTitle>
        <CardDescription className="truncate">{vendor.baseUrl}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {vendor.models.map((model) => (
            <Badge key={model} variant="outline">
              {model}
            </Badge>
          ))}
        </div>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="xs" onClick={() => onEdit(vendor)}>
            <Icons.edit data-icon="inline-start" />
            <span>编辑</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-destructive"
            onClick={() => onRemove(vendor)}
          >
            <Icons.remove data-icon="inline-start" />
            <span>删除</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { VendorCard };
