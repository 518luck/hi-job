// 职位列表列定义：单列手风琴，Trigger 展示职位与薪资时间，Content 展开详情
import type { ColumnDef } from '@tanstack/react-table';
import { createContext, useContext } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import type { features } from '@/shared/ui/data-table';
import type { RecordedJd } from '@/shared/zod';

import { formatSeenAt } from '../../lib/format';
import { JdDetailView } from './jd-detail-view';

// 手风琴展开状态上下文：由列表组件持有，列定义保持静态避免表格重建
interface JdAccordionContextValue {
  openJobId: string | null;
  onOpenChange: (jobId: string | null) => void;
}

const JdAccordionContext = createContext<JdAccordionContextValue | null>(null);

// 读取手风琴展开状态：必须在 JdAccordionProvider 内使用
const useJdAccordion = (): JdAccordionContextValue => {
  const context = useContext(JdAccordionContext);
  if (context === null) {
    throw new Error('useJdAccordion 必须在 JdAccordionProvider 内使用。');
  }
  return context;
};

// 职位列表列定义：静态列，展开状态经上下文读取（虚拟滚动下避免表格重建）
const jdColumns: ColumnDef<typeof features, RecordedJd>[] = [
  {
    id: 'job',
    header: '职位',
    enableSorting: false,
    cell: ({ row }) => {
      const { openJobId, onOpenChange } = useJdAccordion();
      const jd = row.original;
      return (
        <Accordion
          value={openJobId === null ? [] : [openJobId]}
          onValueChange={(values) => {
            onOpenChange(values[0] ?? null);
          }}
        >
          <AccordionItem value={jd.jobId}>
            <AccordionTrigger className="w-full">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{jd.title}</p>
                  {jd.companyName !== '' && (
                    <p className="truncate text-muted-foreground">
                      {jd.companyName}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span className="text-primary">{jd.salary}</span>
                  <span className="text-muted-foreground">
                    {formatSeenAt(jd.lastSeenAt)}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <JdDetailView jd={jd} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    },
  },
];

export { JdAccordionContext, jdColumns };
