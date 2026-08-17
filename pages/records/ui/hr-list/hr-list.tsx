import { useState } from 'react';

import { hrStore } from '@/shared/infra/storage';
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
import type { Hr } from '@/shared/zod';

import { exportHrsData } from '../../model/export-all';
import { DataTable } from '../data-table';
import { hrColumns } from './columns';

// HR 列表的 props
interface HrListProps {
  hrList: Hr[];
}

// 未沟通时长筛选档位：全部或 N 天内
type TimeFilter = 'all' | '3' | '7' | '30';

// 筛选档位选项：下拉框展示用
const TIME_FILTER_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '3', label: '3 天内' },
  { value: '7', label: '7 天内' },
  { value: '30', label: '30 天内' },
] as const;

// 判断值是否为合法筛选档位
const isTimeFilter = (value: string): value is TimeFilter =>
  value === 'all' || value === '3' || value === '7' || value === '30';

// 判断 HR 是否在 N 天内有过沟通：无时间戳视为不在范围内
const withinDays = (lastMsgAt: number, days: number): boolean =>
  lastMsgAt > 0 && Date.now() - lastMsgAt <= days * 86_400_000;

// HR 列表：时间范围筛选 + 单独导出/清空，表格虚拟滚动展示
function HrList({ hrList }: HrListProps) {
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [clearOpen, setClearOpen] = useState(false);
  const days = filter === 'all' ? null : Number(filter);
  const filtered =
    days === null
      ? hrList
      : hrList.filter((hr) => withinDays(hr.lastMsgAt, days));

  if (hrList.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有聊过的 HR：在 Boss直聘 打开「沟通」页，联系人会自动同步过来
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          items={TIME_FILTER_OPTIONS}
          value={filter}
          onValueChange={(value) => {
            if (value !== null && isTimeFilter(value)) {
              setFilter(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TIME_FILTER_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              void exportHrsData();
            }}
          >
            <Icons.exportData data-icon="inline-start" />
            <span>导出 HR</span>
          </Button>
          <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialogTrigger
              render={<Button variant="destructive" size="xs" />}
            >
              <Icons.clearData data-icon="inline-start" />
              <span>清空 HR</span>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>清空全部 HR 档案？</AlertDialogTitle>
                <AlertDialogDescription>
                  将删除 {hrList.length}{' '}
                  位 HR 的档案数据（不影响职位记录与聊天消息），删除后无法恢复，建议先导出备份。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    void hrStore.clearAllHrs();
                    setClearOpen(false);
                  }}
                >
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          该时间范围内没有 HR
        </p>
      ) : (
        <DataTable
          columns={hrColumns}
          data={filtered}
          getRowClassName={(row) =>
            row.original.status === 'excluded' ? 'opacity-50' : undefined
          }
        />
      )}
    </div>
  );
}

export { HrList };