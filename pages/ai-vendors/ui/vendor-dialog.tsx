// # 厂商添加/编辑弹窗：五个字段表单 + 从接口拉取模型列表

import { useForm } from '@tanstack/react-form';
import type { SubmitEvent } from 'react';
import { useEffect, useState } from 'react';

import { fetchVendorModels } from '@/infra/ai';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import {
  modelLinesOf,
  type VendorDialogFormValues,
  vendorDialogFormSchema,
  vendorFormSchema,
} from '@/shared/zod';

import type { BuiltInVendor } from '../config/built-in-vendors';

// 弹窗初始值来源：编辑已有记录、内置预设预填或空白新增
type VendorDialogSeed =
  | { record: AiVendorRecord }
  | { preset: BuiltInVendor }
  | null;

// API 格式取值类型：从弹窗表单值派生
type ApiFormat = VendorDialogFormValues['apiFormat'];

// API 格式选项：label 标注各协议在 Base URL 后追加的对话端点路径
const API_FORMAT_OPTIONS: Array<{ value: ApiFormat; label: string }> = [
  { value: 'openai', label: 'OpenAI 兼容（/chat/completions）' },
  { value: 'anthropic', label: 'Anthropic Messages（/v1/messages）' },
];

// API 格式合法值判断，用于 Select 回调收窄（清空选择时 Base UI 会回调 null）
const isApiFormat = (value: string | null): value is ApiFormat =>
  value === 'openai' || value === 'anthropic';

// 字段错误文案：兼容自定义校验的 string 与 schema 校验的 issue 对象两种形态
const errorTextOf = (errors: ReadonlyArray<unknown>): string | undefined => {
  const [first] = errors;
  if (first === undefined) {
    return undefined;
  }
  if (typeof first === 'string') {
    return first;
  }
  if (first !== null && typeof first === 'object' && 'message' in first) {
    return String(first.message);
  }
  return undefined;
};

// 种子转表单初值：编辑回填 / 预设预填（密钥留空）/ 空白
const seedToValues = (seed: VendorDialogSeed): VendorDialogFormValues => {
  if (seed === null) {
    return {
      name: '',
      baseUrl: '',
      apiKey: '',
      apiFormat: 'openai',
      modelsText: '',
    };
  }
  if ('record' in seed) {
    const { record } = seed;
    return {
      name: record.name,
      baseUrl: record.baseUrl,
      apiKey: record.apiKey,
      apiFormat: record.apiFormat,
      modelsText: record.models.join('\n'),
    };
  }
  const { preset } = seed;
  return {
    name: preset.name,
    baseUrl: preset.baseUrl,
    apiKey: '',
    apiFormat: preset.apiFormat,
    modelsText: preset.models.join('\n'),
  };
};

// 厂商表单弹窗：open 受控，seed 决定回填内容
interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: VendorDialogSeed;
}

function VendorDialog({ open, onOpenChange, seed }: VendorDialogProps) {
  const [pulling, setPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState('');

  // 表单级 schema 挂 onSubmit，校验错误由 TanStack Form 自动映射到各字段
  const form = useForm({
    defaultValues: seedToValues(seed),
    validators: { onSubmit: vendorDialogFormSchema },
    onSubmit: async ({ value }) => {
      const parsed = vendorFormSchema.parse({
        name: value.name,
        baseUrl: value.baseUrl,
        apiKey: value.apiKey,
        apiFormat: value.apiFormat,
        models: modelLinesOf(value.modelsText),
      });
      const now = Date.now();
      const vendorId =
        seed !== null && 'record' in seed
          ? seed.record.vendorId
          : crypto.randomUUID();
      await aiVendorStore.saveVendor({
        vendor: { vendorId, ...parsed, createdAt: now, updatedAt: now },
      });
      onOpenChange(false);
    },
  });

  // 每次打开按种子重置表单：编辑回填 / 预设预填 / 空白
  useEffect(() => {
    if (open) {
      form.reset(seedToValues(seed));
      setPullMessage('');
    }
  }, [open, seed, form]);

  // 提交入口：原生 form 事件转交 TanStack Form 校验与提交
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit();
  };

  // 拉取模型列表：先申请跨域权限，成功后回填文本域
  const handlePullModels = async (applyModels: (text: string) => void) => {
    const { baseUrl, apiKey, apiFormat } = form.state.values;
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
      applyModels(models.join('\n'));
      setPullMessage(`已拉取 ${models.length} 个模型`);
    } catch (error) {
      setPullMessage(
        `拉取失败：${error instanceof Error ? error.message : '未知错误'}`,
      );
    } finally {
      setPulling(false);
    }
  };

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
          <form.Field name="name">
            {(field) => {
              const error = errorTextOf(field.state.meta.errors);
              return (
                <div className="grid gap-1.5">
                  <Label htmlFor="vendor-name">厂商名称</Label>
                  <Input
                    id="vendor-name"
                    value={field.state.value}
                    aria-invalid={error !== undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {error !== undefined && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <form.Field name="baseUrl">
            {(field) => {
              const error = errorTextOf(field.state.meta.errors);
              return (
                <div className="grid gap-1.5">
                  <Label htmlFor="vendor-base-url">Base URL</Label>
                  <Input
                    id="vendor-base-url"
                    value={field.state.value}
                    placeholder="https://api.example.com/v1"
                    aria-invalid={error !== undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {error !== undefined && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <form.Field name="apiKey">
            {(field) => {
              const error = errorTextOf(field.state.meta.errors);
              return (
                <div className="grid gap-1.5">
                  <Label htmlFor="vendor-api-key">API Key</Label>
                  <Input
                    id="vendor-api-key"
                    type="password"
                    value={field.state.value}
                    aria-invalid={error !== undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {error !== undefined && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>
              );
            }}
          </form.Field>
          <form.Field name="apiFormat">
            {(field) => (
              <div className="grid gap-1.5">
                <Label>API 格式</Label>
                <Select
                  items={API_FORMAT_OPTIONS}
                  value={field.state.value}
                  onValueChange={(next) => {
                    if (isApiFormat(next)) {
                      field.handleChange(next);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {API_FORMAT_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <form.Field name="modelsText">
            {(field) => {
              const error = errorTextOf(field.state.meta.errors);
              return (
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vendor-models">模型列表（每行一个）</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={pulling}
                      onClick={() => {
                        void handlePullModels(field.handleChange);
                      }}
                    >
                      <Icons.refresh data-icon="inline-start" />
                      <span>{pulling ? '拉取中…' : '拉取模型列表'}</span>
                    </Button>
                  </div>
                  <Textarea
                    id="vendor-models"
                    rows={4}
                    className="max-h-48 overflow-y-auto"
                    value={field.state.value}
                    aria-invalid={error !== undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {/* 拉取状态文案常驻占位：出现时不顶高弹窗把按钮挤出屏幕 */}
                  <p className="flex min-h-4 items-center text-xs text-muted-foreground">
                    {pullMessage}
                  </p>
                  {error !== undefined && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>
              );
            }}
          </form.Field>
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
