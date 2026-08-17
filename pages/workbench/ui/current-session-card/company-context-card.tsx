// # 职位列表页上下文卡片：当前选中职位的公司名、规模与 HR 活跃状态
import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { VueJobData } from '@/shared/zod';

// 职位列表页上下文卡片的 props
interface CompanyContextCardProps {
  job: VueJobData; // 当前选中职位的页面数据
}

// 职位列表页上下文卡片：当前选中职位的公司名、规模与 HR 活跃状态
function CompanyContextCard({ job }: CompanyContextCardProps) {
  const [blocked, setBlocked] = useState(false);
  // 挂载时读取名单，确认当前公司是否已在屏蔽名单
  useEffect(() => {
    void sendMessage('getBlockedCompanyNames', undefined)
      .then((names) => {
        setBlocked(names.includes(job.brandName));
      })
      .catch(() => {});
  }, [job.brandName]);

  // 把当前公司加入屏蔽名单：保存后广播职位列表页即时刷新遮罩
  const blockCompany = async (): Promise<void> => {
    const names = await sendMessage('getBlockedCompanyNames', undefined).catch(
      (): string[] => [],
    );
    if (names.includes(job.brandName)) {
      setBlocked(true);
      return;
    }
    await sendMessage('saveBlockedCompanies', [...names, job.brandName]);
    setBlocked(true);
  };

  // 活跃状态文本缺失时回退在线状态；在线状态也缺失时显示未知
  const activeText =
    job.bossActiveDesc ||
    (job.bossOnline === undefined ? '未知' : job.bossOnline ? '在线' : '离线');
  return (
    <Card size="sm" className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm">
            {job.brandName}
          </span>
          <Button
            variant="outline"
            size="xs"
            disabled={blocked}
            onClick={() => {
              void blockCompany();
            }}
          >
            {blocked ? '已屏蔽' : '屏蔽该公司'}
          </Button>
        </CardTitle>
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
