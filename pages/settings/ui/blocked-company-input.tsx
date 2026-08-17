import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { BLOCKED_COMPANY_TEMPLATE } from '../config/blocked-company-template';
import { useBlockedCompanies } from '../model/use-blocked-companies';

// 屏蔽公司标签输入：回车或点「添加」写入名单（支持逗号/顿号分隔批量粘贴），点 × 移除单个标签
function BlockedCompanyInput() {
  const { names, addNames, removeName, clearNames } = useBlockedCompanies();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const submit = () => {
    if (draft.trim() === '') {
      return;
    }
    setDraft('');
    void addNames(draft.split(/[,，、;；\n]+/));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      submit();
    }
  };

  // 复制当前名单：中文逗号分隔，可整段粘贴回输入框恢复
  const copyNames = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(names.join('，'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默失败，不影响其他功能
    }
  };

  const empty = names.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">屏蔽公司</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={empty}
            onClick={() => void copyNames()}
          >
            {copied ? '已复制' : '复制'}
          </Button>
          <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  disabled={empty}
                />
              }
            >
              清空
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>清空全部屏蔽公司？</AlertDialogTitle>
                <AlertDialogDescription>
                  将移除 {names.length}{' '}
                  家公司的屏蔽名单，职位列表页遮罩同步消失；模板公司可重新一键导入，手动添加的需要重新输入。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    void clearNames();
                    setClearOpen(false);
                  }}
                >
                  清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground">暂无屏蔽的公司</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1 pr-1">
              {name}
              <button
                type="button"
                aria-label={`移除 ${name}`}
                className="text-sm leading-none text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => void removeName(name)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="输入公司名，支持逗号分隔批量粘贴"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="button" variant="outline" onClick={submit}>
          添加
        </Button>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => void addNames(BLOCKED_COMPANY_TEMPLATE)}
      >
        导入常见外包公司模板（{BLOCKED_COMPANY_TEMPLATE.length} 家）
      </Button>
    </div>
  );
}

export { BlockedCompanyInput };
