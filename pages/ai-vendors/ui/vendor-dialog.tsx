// # 厂商添加/编辑弹窗：五个字段表单 + 从接口拉取模型列表

import type { SubmitEvent } from 'react';
import { useEffect, useState } from 'react';

import type { AiVendorRecord } from '@/infra/storage';
import { aiVendorStore } from '@/infra/storage';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Icons } from '@/shared/ui/icons';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { vendorFormSchema } from '@/shared/zod/ai-vendor';
import { fieldErrorsOf } from '@/shared/zod/field-errors';

import type { BuiltInVendor } from '../config/built-in-vendors';
import { fetchVendorModels } from '../model/vendor-client';

// 弹窗初始值来源：编辑已有记录、内置预设预填或空白新增
type VendorDialogSeed =
  | { record: AiVendorRecord }
  | { preset: BuiltInVendor }
  | null;

// API 格式合法值判断，用于 ToggleGroup 回调收窄
const isApiFormat = (value: string): value is 'openai' | 'anthropic' =>
  value === 'openai' || value === 'anthropic';

// 厂商表单弹窗：open 受控，seed 决定回填内容
interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: VendorDialogSeed;
}

function VendorDialog({ open, onOpenChange, seed }: VendorDialogProps) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiFormat, setApiFormat] = useState<'openai' | 'anthropic'>('openai');
  const [modelsText, setModelsText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pulling, setPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState('');

  // 每次打开按种子重置表单：编辑回填 / 预设预填 / 空白
  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    setPullMessage('');
    if (seed === null) {
      setName('');
      setBaseUrl('');
      setApiKey('');
      setApiFormat('openai');
      setModelsText('');
      return;
    }
    if ('record' in seed) {
      const { record } = seed;
      setName(record.name);
      setBaseUrl(record.baseUrl);
      setApiKey(record.apiKey);
      setApiFormat(record.apiFormat);
      setModelsText(record.models.join('\n'));
      return;
    }
    const { preset } = seed;
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setApiKey('');
    setApiFormat(preset.apiFormat);
    setModelsText(preset.models.join('\n'));
  }, [open, seed]);

  // 提交表单：校验通过后落库并关闭弹窗
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const models = modelsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    const parsed = vendorFormSchema.safeParse({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      apiFormat,
      models,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }

    const now = Date.now();
    const vendorId =
      seed !== null && 'record' in seed
        ? seed.record.vendorId
        : crypto.randomUUID();
    void aiVendorStore.saveVendor({
      vendor: { vendorId, ...parsed.data, createdAt: now, updatedAt: now },
    });
    onOpenChange(false);
  };

  // 拉取模型列表：先申请跨域权限，成功后回填文本域
  const handlePullModels = async () => {
    if (baseUrl.trim() === '' || apiKey.trim() === '') {
      setPullMessage('请先填写 Base URL 和 API Key');
      return;
    }
    setPulling(true);
    setPullMessage('拉取中…');
    try {
      const models = await fetchVendorModels({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        apiFormat,
      });
      if (models.length === 0) {
        throw new Error('接口未返回任何模型');
      }
      setModelsText(models.join('\n'));
      setPullMessage(`已拉取 ${models.length} 个模型`);
      setErrors({});
    } catch (error) {
      setPullMessage(
        `拉取失败：${error instanceof Error ? error.message : '未知错误'}`,
      );
    } finally {
      setPulling(false);
    }
  };

  // 字段错误文案，无错误时为 undefined 供条件渲染
  const errorOf = (field: string): string | undefined => errors[field];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {seed !== null && 'record' in seed ? '编辑厂商' : '添加厂商'}
            </DialogTitle>
            <DialogDescription>
              配置保存在本机，API Key 不会上传到任何服务器。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="vendor-name">厂商名称</Label>
            <Input
              id="vendor-name"
              value={name}
              aria-invalid={errorOf('name') !== undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {errorOf('name') !== undefined && (
              <p className="text-xs text-destructive">{errorOf('name')}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vendor-base-url">Base URL</Label>
            <Input
              id="vendor-base-url"
              value={baseUrl}
              placeholder="https://api.example.com/v1"
              aria-invalid={errorOf('baseUrl') !== undefined}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
            {errorOf('baseUrl') !== undefined && (
              <p className="text-xs text-destructive">{errorOf('baseUrl')}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vendor-api-key">API Key</Label>
            <Input
              id="vendor-api-key"
              type="password"
              value={apiKey}
              aria-invalid={errorOf('apiKey') !== undefined}
              onChange={(event) => setApiKey(event.target.value)}
            />
            {errorOf('apiKey') !== undefined && (
              <p className="text-xs text-destructive">{errorOf('apiKey')}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>API 格式</Label>
            <ToggleGroup
              variant="outline"
              className="w-full"
              value={[apiFormat]}
              onValueChange={(values) => {
                const next = values[0];
                if (next !== undefined && isApiFormat(next)) {
                  setApiFormat(next);
                }
              }}
            >
              <ToggleGroupItem value="openai" className="flex-1">
                OpenAI 兼容
              </ToggleGroupItem>
              <ToggleGroupItem value="anthropic" className="flex-1">
                Anthropic
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="vendor-models">模型列表（每行一个）</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={pulling}
                onClick={() => {
                  void handlePullModels();
                }}
              >
                <Icons.refresh data-icon="inline-start" />
                <span>{pulling ? '拉取中…' : '拉取模型列表'}</span>
              </Button>
            </div>
            <Textarea
              id="vendor-models"
              rows={4}
              value={modelsText}
              aria-invalid={errorOf('models') !== undefined}
              onChange={(event) => setModelsText(event.target.value)}
            />
            {pullMessage !== '' && (
              <p className="text-xs text-muted-foreground">{pullMessage}</p>
            )}
            {errorOf('models') !== undefined && (
              <p className="text-xs text-destructive">{errorOf('models')}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              取消
            </DialogClose>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { VendorDialogSeed };
export { VendorDialog };
