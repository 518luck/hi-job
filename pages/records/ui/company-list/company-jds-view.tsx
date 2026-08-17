// 公司职位子列表：展开面板展示该公司职位，封顶高度内部滚动
import { Icons } from '@/shared/ui/icons';
import type { RecordedJd } from '@/shared/zod';

import { formatSeenAt } from '../../lib/format';

// 公司职位子列表的 props
interface CompanyJdsViewProps {
  jds: RecordedJd[];
}

// 展开面板里的公司职位列表：职位名/薪资/记录时间，整行可点击打开职位
function CompanyJdsView({ jds }: CompanyJdsViewProps) {
  if (jds.length === 0) {
    return <p className="px-1 text-muted-foreground">暂无职位记录</p>;
  }
  return (
    <div className="flex max-h-80 flex-col overflow-y-auto px-1">
      {jds.map((jd) => (
        <a
          key={jd.jobId}
          href={jd.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 border-b border-border py-1.5 text-left last:border-0 hover:bg-muted"
        >
          <span className="min-w-0 flex-1 truncate">{jd.title}</span>
          <span className="shrink-0 text-primary">{jd.salary}</span>
          <span className="shrink-0 text-muted-foreground">
            {formatSeenAt(jd.lastSeenAt)}
          </span>
          <Icons.externalLink className="size-3 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

export { CompanyJdsView };
