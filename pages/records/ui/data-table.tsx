// 通用数据表格：TanStack Table v9 数据层 + 虚拟滚动行渲染，表头可排序
import type {
  ColumnDef,
  Row,
  RowData,
  SortingState,
} from '@tanstack/react-table';
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icons } from '@/shared/ui/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

// 表格特性：排序行模型与内置排序函数（v9 features 化配置，列定义依赖其类型）
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

// 数据表格的 props：行数据需满足 TanStack 的行类型约束
interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<typeof features, TData>[];
  data: TData[];
  getRowClassName?: (row: Row<typeof features, TData>) => string | undefined;
}

// 渲染表头排序指示符：升序/降序箭头
const sortIndicatorOf = (sorted: false | 'asc' | 'desc'): React.ReactNode => {
  if (sorted === 'asc') {
    return <Icons.arrowUp className="size-3" />;
  }
  if (sorted === 'desc') {
    return <Icons.arrowDown className="size-3" />;
  }
  return null;
};

// 通用数据表格：虚拟滚动只渲染可视行，表头固定、行样式由 getRowClassName 定制
function DataTable<TData extends RowData>({
  columns,
  data,
  getRowClassName,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const table = useTable<typeof features, TData>({
    features,
    columns,
    data,
    state: { sorting },
    onSortingChange: setSorting,
  });
  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    getItemKey: (index) => rows[index]?.id ?? String(index),
    overscan: 8,
  });

  return (
    <div ref={scrollRef} className="max-h-[70vh] overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="flex w-full">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="flex min-w-0 flex-1 items-center"
                >
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <table.FlexRender header={header} />
                      {sortIndicatorOf(header.column.getIsSorted())}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          className="relative block"
          style={{ height: rowVirtualizer.getTotalSize() }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (row === undefined) {
              return null;
            }
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={cn('absolute flex w-full', getRowClassName?.(row))}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="min-w-0 flex-1 p-2">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable, features };
