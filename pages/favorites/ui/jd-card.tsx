import { Badge } from '@/shared/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import type { SelectedJd } from '@/shared/zod/jd';

// JD 展示卡片的 props
interface JdCardProps {
  jd: SelectedJd;
}

// JD 展示卡片：标题、薪资、标签、地址与职位描述
function JdCard({ jd }: JdCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span className="truncate">{jd.title}</span>
          <span className="shrink-0 text-primary">{jd.salary}</span>
        </CardTitle>
        <CardDescription>{jd.recruiter}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {jd.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {jd.address !== '' && (
          <p className="text-xs text-muted-foreground">{jd.address}</p>
        )}
        <p className="text-xs whitespace-pre-line text-muted-foreground">
          {jd.description}
        </p>
      </CardContent>
    </Card>
  );
}

export { JdCard };
