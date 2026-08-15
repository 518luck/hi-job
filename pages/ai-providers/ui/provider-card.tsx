// # 厂商配置卡片：名称、API 格式、地址与模型列表，编辑/删除入口
import type { AiProviderRecord } from '@/infra/storage';
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
interface ProviderCardProps {
  provider: AiProviderRecord;
  onEdit: (provider: AiProviderRecord) => void;
  onRemove: (provider: AiProviderRecord) => void;
}

// API 格式的展示文案
const apiFormatLabel = (format: AiProviderRecord['apiFormat']): string =>
  format === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容';

// 厂商配置卡片：聚合该厂商的全部配置信息与操作按钮
function ProviderCard({ provider, onEdit, onRemove }: ProviderCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span className="truncate">{provider.name}</span>
          <Badge variant="secondary" className="shrink-0">
            {apiFormatLabel(provider.apiFormat)}
          </Badge>
        </CardTitle>
        <CardDescription className="truncate">
          {provider.baseUrl}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {provider.models.map((model) => (
            <Badge key={model} variant="outline">
              {model}
            </Badge>
          ))}
        </div>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="xs" onClick={() => onEdit(provider)}>
            <Icons.edit data-icon="inline-start" />
            <span>编辑</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-destructive"
            onClick={() => onRemove(provider)}
          >
            <Icons.remove data-icon="inline-start" />
            <span>删除</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProviderCard };
