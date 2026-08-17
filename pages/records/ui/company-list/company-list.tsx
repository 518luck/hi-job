import { useState } from 'react';

import type { CompanyRecord, RecordedJd } from '@/shared/zod';

import { DataTable } from '../data-table';
import { CompanyAccordionContext, companyColumns } from './columns';

// 公司列表的 props
interface CompanyListProps {
  companies: CompanyRecord[];
  jds: RecordedJd[];
}

// 公司列表：表格虚拟滚动 + 手风琴展开该公司职位子列表
function CompanyList({ companies, jds }: CompanyListProps) {
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null);

  if (companies.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有记录公司：在 Boss直聘 页面点开职位，这里会自动出现
      </p>
    );
  }
  return (
    <CompanyAccordionContext.Provider
      value={{ openCompanyId, onOpenChange: setOpenCompanyId, jds }}
    >
      <DataTable
        columns={companyColumns}
        data={companies}
        estimateSize={() => 36}
      />
    </CompanyAccordionContext.Provider>
  );
}

export { CompanyList };
