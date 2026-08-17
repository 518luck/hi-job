// 职位详情：展开面板展示描述全文、标签、地址与打开链接
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import type { RecordedJd } from '@/shared/zod';

// 职位详情展示的 props
interface JdDetailViewProps {
  jd: RecordedJd;
}

// 展开面板里的职位详情：封顶高度内部滚动，底部提供打开职位链接
function JdDetailView({ jd }: JdDetailViewProps) {
  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto px-1">
      {jd.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {jd.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {jd.description !== '' && (
        <p className="text-muted-foreground whitespace-pre-line">
          {jd.description}
        </p>
      )}
      {jd.address !== '' && (
        <p className="text-muted-foreground">{jd.address}</p>
      )}
      <Button
        size="xs"
        variant="outline"
        onClick={() => window.open(jd.url, '_blank')}
      >
        <Icons.externalLink data-icon="inline-start" />
        <span>打开职位</span>
      </Button>
    </div>
  );
}

export { JdDetailView };
