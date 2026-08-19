import { ClipboardList } from 'lucide-react';

import { cn } from '../../lib/utils';

// 单条职位记录：职位名 + 公司 + 薪资 + 标签
interface MockJob {
  title: string;
  company: string;
  salary: string;
  tags: readonly string[];
}

// 示例职位：取自 BOSS 直聘常见的真实字段形态
const MOCK_JOBS: readonly MockJob[] = [
  {
    title: '高级前端工程师',
    company: '字节跳动',
    salary: '25-40K·15薪',
    tags: ['React', '性能优化', '本科'],
  },
  {
    title: '全栈开发工程师',
    company: '美团',
    salary: '30-50K·14薪',
    tags: ['Node.js', 'Vue', '经验不限'],
  },
  {
    title: 'Web 前端专家',
    company: '蚂蚁集团',
    salary: '35-60K·16薪',
    tags: ['微前端', 'TypeScript', '杭州'],
  },
];

// 记录页 mockup：自动记录的职位时间流，薪资右对齐、标签小胶囊
export function RecordsMockup() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <ClipboardList aria-hidden className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          记录 · 职位
        </span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {MOCK_JOBS.length}
        </span>
      </div>
      <ul className="divide-y">
        {MOCK_JOBS.map((job) => (
          <li key={job.title} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {job.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {job.company}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-emerald-600">
                {job.salary}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'rounded-md bg-muted px-1.5 py-0.5',
                    'text-[11px] text-muted-foreground',
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
