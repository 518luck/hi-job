import type { Hr } from '@/shared/zod';

import { DataTable } from '../data-table';
import { hrColumns } from './columns';

// HR 列表的 props
interface HrListProps {
  hrList: Hr[];
}

// HR 列表：TanStack 数据表，表头可排序，标出未沟通时长、等你回复与已排除
function HrList({ hrList }: HrListProps) {
  if (hrList.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有聊过的 HR：在 Boss直聘 打开「沟通」页，联系人会自动同步过来
      </p>
    );
  }
  return (
    <DataTable
      columns={hrColumns}
      data={hrList}
      getRowClassName={(row) =>
        row.original.status === 'excluded' ? 'opacity-50' : undefined
      }
    />
  );
}

export { HrList };
