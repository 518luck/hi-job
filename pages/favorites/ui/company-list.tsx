import { useState } from 'react';

import type { CompanyRecord, RecordedJd } from '@/infra/storage';
import { cn } from '@/shared/lib/cn';
import { Icons } from '@/shared/ui/icons';

import { JdCard } from './jd-card';

// 公司聚合列表的 props
interface CompanyListProps {
  companies: CompanyRecord[];
  jds: RecordedJd[];
}

// 公司聚合列表：按最近推送倒序展示公司，点击展开该公司职位卡片
function CompanyList({ companies, jds }: CompanyListProps) {
  const [openId, setOpenId] = useState('');

  return (
    <div className="flex flex-col">
      {companies.map((company) => {
        const isOpen = openId === company.companyId;
        const companyJds = jds.filter((jd) =>
          company.jobIds.includes(jd.jobId),
        );

        return (
          <div key={company.companyId} className="flex flex-col">
            <button
              type="button"
              className="flex items-center gap-2 border-b border-border px-1 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setOpenId(isOpen ? '' : company.companyId);
              }}
            >
              <Icons.chevronDown
                data-icon="inline-start"
                className={cn(
                  'size-3.5 shrink-0 text-muted-foreground transition-transform',
                  isOpen ? '' : '-rotate-90',
                )}
              />
              <span className="min-w-0 flex-1 truncate">
                {company.companyName}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {company.jobIds.length} 个职位
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSeenAt(company.lastSeenAt)}
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-2 py-2 pl-2">
                {companyJds.map((jd) => (
                  <JdCard key={jd.jobId} jd={jd} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 格式化最近出现时间：当天显示时分，其余显示月日
const formatSeenAt = (timestamp: number): string => {
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
      });
};

export { CompanyList };
