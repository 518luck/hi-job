import { useMemo, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select';
import type { RecordedJd } from '@/shared/zod';

import { exportJdsData } from '../../model/export-all';
import { DataTable } from '../data-table';
import { JdAccordionContext, jdColumns } from './columns';

// 职位列表的 props
interface JdListProps {
  jds: RecordedJd[];
}

// 记录时间筛选档位：全部或 N 天内
type TimeFilter = 'all' | '3' | '7' | '30';

// 列表排序方向：最近记录优先或最早记录优先
type SortBy = 'latest' | 'oldest';

// 筛选档位选项：下拉框展示用
const TIME_FILTER_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '3', label: '3 天内' },
  { value: '7', label: '7 天内' },
  { value: '30', label: '30 天内' },
] as const;

// 排序方向选项：下拉框展示用
const SORT_OPTIONS = [
  { value: 'latest', label: '最近记录优先' },
  { value: 'oldest', label: '最早记录优先' },
] as const;

// 判断值是否为合法筛选档位
const isTimeFilter = (value: string): value is TimeFilter =>
  value === 'all' || value === '3' || value === '7' || value === '30';

// 判断值是否为合法排序方向
const isSortBy = (value: string): value is SortBy =>
  value === 'latest' || value === 'oldest';

// 筛选档位的短文案：trigger 上只显示少量信息
const shortLabelOf = (filter: TimeFilter): string =>
  filter === 'all' ? '全部' : `${filter} 天`;

// 判断职位是否在 N 天内记录：无时间戳视为不在范围内
const withinDays = (lastSeenAt: number, days: number): boolean =>
  lastSeenAt > 0 && Date.now() - lastSeenAt <= days * 86_400_000;

// 职位列表：记录时间筛选/排序 + 手风琴展开详情，表格虚拟滚动展示
function JdList({ jds }: JdListProps) {
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const days = filter === 'all' ? null : Number(filter);
  const filtered =
    days === null ? jds : jds.filter((jd) => withinDays(jd.lastSeenAt, days));
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        sortBy === 'latest'
          ? b.lastSeenAt - a.lastSeenAt
          : a.lastSeenAt - b.lastSeenAt,
      ),
    [filtered, sortBy],
  );

  if (jds.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有记录职位：在 Boss直聘 页面点开职位，这里会自动出现
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={TIME_FILTER_OPTIONS}
          value={filter}
          onValueChange={(value) => {
            if (value !== null && isTimeFilter(value)) {
              setFilter(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="w-fit gap-1" title="时间筛选">
            <Icons.history className="size-3.5" />
            <span>{shortLabelOf(filter)}</span>
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
        <Select
          items={SORT_OPTIONS}
          value={sortBy}
          onValueChange={(value) => {
            if (value !== null && isSortBy(value)) {
              setSortBy(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="w-fit" title="排序方式">
            {sortBy === 'latest' ? (
              <Icons.arrowDown className="size-3.5" />
            ) : (
              <Icons.arrowUp className="size-3.5" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="icon-sm"
            title="导出职位数据"
            onClick={() => {
              void exportJdsData();
            }}
          >
            <Icons.exportData />
          </Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">该时间范围内没有职位</p>
      ) : (
        <JdAccordionContext.Provider
          value={{ openJobId, onOpenChange: setOpenJobId }}
        >
          <DataTable
            columns={jdColumns}
            data={sorted}
            estimateSize={() => 44}
          />
        </JdAccordionContext.Provider>
      )}
    </div>
  );
}

export { JdList };
