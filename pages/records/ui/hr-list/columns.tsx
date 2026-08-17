// HR 列表列定义：单列手风琴，Trigger 展示信息与状态，Content 展开聊天记录
import type { ColumnDef } from '@tanstack/react-table';
import { createContext, useContext } from 'react';

import { jobUrlOf } from '@/shared/lib/boss-url';
import { sinceChatText, sinceDays, toneOf } from '@/shared/lib/chat-time';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import type { features } from '@/shared/ui/data-table';
import { Icons } from '@/shared/ui/icons';
import type { Hr } from '@/shared/zod';

import { HrChatView } from './chat-view';

// 手风琴展开状态上下文：由列表组件持有，列定义保持静态避免表格重建
interface HrAccordionContextValue {
  openBossId: string | null;
  onOpenChange: (bossId: string | null) => void;
  onToggleExcluded: (hr: Hr) => void;
}

const HrAccordionContext = createContext<HrAccordionContextValue | null>(null);

// 读取手风琴展开状态：必须在 HrAccordionProvider 内使用
const useHrAccordion = (): HrAccordionContextValue => {
  const context = useContext(HrAccordionContext);
  if (context === null) {
    throw new Error('useHrAccordion 必须在 HrAccordionProvider 内使用。');
  }
  return context;
};

// HR 列表列定义：静态列，展开状态经上下文读取（虚拟滚动下避免表格重建）
const hrColumns: ColumnDef<typeof features, Hr>[] = [
  {
    id: 'hr',
    header: 'HR',
    enableSorting: false,
    cell: ({ row }) => {
      const { openBossId, onOpenChange, onToggleExcluded } = useHrAccordion();
      const hr = row.original;
      const { bossName, bossTitle, brandName, status, lastIsSelf } = hr;
      return (
        <Accordion
          value={openBossId === null ? [] : [openBossId]}
          onValueChange={(values) => {
            onOpenChange(values[0] ?? null);
          }}
        >
          <AccordionItem value={hr.encryptBossId}>
            <AccordionTrigger className="w-full">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        'truncate font-medium',
                        status === 'excluded' && 'line-through',
                      )}
                    >
                      {bossName}
                    </span>
                    {bossTitle !== '' && (
                      <span className="shrink-0 text-muted-foreground">
                        {bossTitle}
                      </span>
                    )}
                  </div>
                  {brandName !== '' && (
                    <p className="truncate text-muted-foreground">
                      {brandName}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className={toneOf(hr.lastMsgAt)}>
                    {sinceChatText(hr.lastMsgAt)}
                  </span>
                  <div className="flex gap-1">
                    {lastIsSelf && sinceDays(hr.lastMsgAt) >= 1 && (
                      <Badge className="bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                        等你回复
                      </Badge>
                    )}
                  </div>
                  {/* 行内操作：按钮用 span 渲染避免嵌套在展开触发器内 */}
                  <div className="flex items-center gap-1">
                    <Button
                      render={<span />}
                      size="xs"
                      variant={
                        status === 'excluded' ? 'outline' : 'destructive'
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleExcluded(hr);
                      }}
                    >
                      {status === 'excluded' ? '恢复' : 'Pass'}
                    </Button>
                    <Button
                      render={<span />}
                      size="icon-xs"
                      variant="ghost"
                      title="打开职位"
                      onClick={(event) => {
                        event.stopPropagation();
                        window.open(jobUrlOf(hr), '_blank');
                      }}
                    >
                      <Icons.externalLink />
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <HrChatView encryptBossId={hr.encryptBossId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    },
  },
];

export { HrAccordionContext, hrColumns };
