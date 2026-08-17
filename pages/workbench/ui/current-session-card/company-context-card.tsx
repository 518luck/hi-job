// 职位列表页上下文卡片：当前选中职位的公司名、规模与 HR 活跃状态
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { VueJobData } from '@/shared/zod';

// 职位列表页上下文卡片的 props
interface CompanyContextCardProps {
  job: VueJobData; // 当前选中职位的页面数据
}

// 职位列表页上下文卡片：当前选中职位的公司名、规模与 HR 活跃状态
function CompanyContextCard({ job }: CompanyContextCardProps) {
  // 活跃状态文本缺失时回退在线状态；在线状态也缺失时显示未知
  const activeText =
    job.bossActiveDesc ||
    (job.bossOnline === undefined ? '未知' : job.bossOnline ? '在线' : '离线');
  return (
    <Card size="sm" className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="truncate text-sm">{job.brandName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {job.companyScale !== '' && (
            <Badge variant="outline">{job.companyScale}</Badge>
          )}
          {job.companyIndustry !== '' && (
            <Badge variant="outline">{job.companyIndustry}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          HR 活跃状态：{activeText}
        </p>
      </CardContent>
    </Card>
  );
}

export { CompanyContextCard };
