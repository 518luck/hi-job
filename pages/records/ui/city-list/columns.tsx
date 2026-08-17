// 地区列表列定义：城市名与职位数，纯信息展示无展开
import type { ColumnDef } from '@tanstack/react-table';

import type { RecordedJd } from '@/shared/zod';

import type { features } from '../data-table';

// 地区聚合行的数据结构：城市名与所属职位
interface CityGroup {
  city: string;
  cityJds: RecordedJd[];
}

// 地区列表列定义：静态列，城市与职位数两段布局
const cityColumns: ColumnDef<typeof features, CityGroup>[] = [
  {
    id: 'city',
    header: '地区',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">
          {row.original.city}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {row.original.cityJds.length} 个职位
        </span>
      </div>
    ),
  },
];

export type { CityGroup };
export { cityColumns };
