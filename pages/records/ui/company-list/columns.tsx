// 公司列表列定义：单列手风琴，Trigger 展示公司与职位数，Content 展开职位子列表
import type { ColumnDef } from '@tanstack/react-table';
import { createContext, useContext } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import type { features } from '@/shared/ui/data-table';
import type { CompanyRecord, RecordedJd } from '@/shared/zod';

import { formatSeenAt } from '../../lib/format';
import { CompanyJdsView } from './company-jds-view';

// 手风琴展开状态与关联职位上下文：由列表组件持有，列定义保持静态避免表格重建
interface CompanyAccordionContextValue {
  openCompanyId: string | null;
  onOpenChange: (companyId: string | null) => void;
  jds: RecordedJd[];
}

const CompanyAccordionContext =
  createContext<CompanyAccordionContextValue | null>(null);

// 读取手风琴展开状态：必须在 CompanyAccordionProvider 内使用
const useCompanyAccordion = (): CompanyAccordionContextValue => {
  const context = useContext(CompanyAccordionContext);
  if (context === null) {
    throw new Error(
      'useCompanyAccordion 必须在 CompanyAccordionProvider 内使用。',
    );
  }
  return context;
};

// 公司列表列定义：静态列，展开状态与关联职位经上下文读取
const companyColumns: ColumnDef<typeof features, CompanyRecord>[] = [
  {
    id: 'company',
    header: '公司',
    enableSorting: false,
    cell: ({ row }) => {
      const { openCompanyId, onOpenChange, jds } = useCompanyAccordion();
      const company = row.original;
      const companyJds = jds.filter((jd) => company.jobIds.includes(jd.jobId));
      return (
        <Accordion
          value={openCompanyId === null ? [] : [openCompanyId]}
          onValueChange={(values) => {
            onOpenChange(values[0] ?? null);
          }}
        >
          <AccordionItem value={company.companyId}>
            <AccordionTrigger className="w-full">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {company.companyName}
                </span>
                <div className="flex shrink-0 items-center gap-2 text-right">
                  <span className="text-muted-foreground">
                    {company.jobIds.length} 个职位
                  </span>
                  <span className="text-muted-foreground">
                    {formatSeenAt(company.lastSeenAt)}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompanyJdsView jds={companyJds} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    },
  },
];

export { CompanyAccordionContext, companyColumns };
