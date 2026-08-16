// # AI 厂商设置页：厂商配置的增删改查与内置预设快速启用
import { useState } from 'react';

import type { AiVendorRecord } from '@/shared/infra/storage';
import { aiVendorStore } from '@/shared/infra/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';

import { BUILT_IN_VENDORS } from '../config/built-in-vendors';
import { useAiVendors } from '../model/use-ai-vendors';
import { VendorCard } from './vendor-card';
import { VendorDialog, type VendorDialogSeed } from './vendor-dialog';

// AI 厂商设置页：内置厂商预设 + 自定义厂商，配置保存于本机
function AiVendorsPage() {
  const { vendors, loading } = useAiVendors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seed, setSeed] = useState<VendorDialogSeed>(null);
  const [removing, setRemoving] = useState<AiVendorRecord | null>(null);

  // 打开空白新增表单
  const openCreate = () => {
    setSeed(null);
    setDialogOpen(true);
  };

  // 用内置预设打开表单：预填连接信息，密钥由用户补充
  const openPreset = (preset: VendorDialogSeed) => {
    setSeed(preset);
    setDialogOpen(true);
  };

  // 打开编辑表单：回填已有配置
  const openEdit = (record: AiVendorRecord) => {
    setSeed({ record });
    setDialogOpen(true);
  };

  // 渲染厂商列表：读取中、空态与卡片流
  const renderList = () => {
    if (loading) {
      return <p className="text-xs text-muted-foreground">读取中…</p>;
    }
    if (vendors.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有配置厂商：点上方「添加厂商」自定义，或点内置厂商快速启用
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.vendorId}
            vendor={vendor}
            onEdit={openEdit}
            onRemove={setRemoving}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">AI 厂商</h2>
      <p className="text-xs text-muted-foreground">
        管理 AI 厂商：内置预设一键启用，或自定义任意 OpenAI 兼容 / Anthropic
        接口
      </p>
      <Button size="sm" onClick={openCreate}>
        <Icons.add data-icon="inline-start" />
        <span>添加厂商</span>
      </Button>
      <div className="flex flex-wrap gap-1">
        {BUILT_IN_VENDORS.map((preset) => (
          <Button
            key={preset.key}
            variant="outline"
            size="xs"
            onClick={() => openPreset({ preset })}
          >
            {preset.name}
          </Button>
        ))}
      </div>
      {renderList()}
      <VendorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        seed={seed}
      />
      <AlertDialog
        open={removing !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRemoving(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除厂商「{removing?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              将移除该厂商的连接配置，不影响已收藏的职位数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (removing !== null) {
                  void aiVendorStore.removeVendor({
                    vendorId: removing.vendorId,
                  });
                }
                setRemoving(null);
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { AiVendorsPage };
