// 当前会话卡片：最近打开的 HR 信息 + 关联 JD 手风琴，无 JD 时提供抓取跳转
import { useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { hrStore } from '@/shared/infra/storage';
import { jobUrlOf } from '@/shared/lib/boss-url';
import { sinceChatText, toneOf } from '@/shared/lib/chat-time';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Icons } from '@/shared/ui/icons';
import type { RecordedJd } from '@/shared/zod';

import { useCurrentSession } from '../model/use-current-session';

// JD 详情段：展开显示标签、描述与地址，附打开职位链接
// 格式化记录时间：MM-dd，供 JD 展开区展示
const formatRecordedAt = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// JD 详情段：展开显示抓取到的完整职位字段
function JdDetailSection({ jd }: { jd: RecordedJd }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {jd.companyScale !== '' && (
          <Badge variant="outline">{jd.companyScale}</Badge>
        )}
        {jd.companyIndustry !== '' && (
          <Badge variant="outline">{jd.companyIndustry}</Badge>
        )}
      </div>
      {jd.recruiter !== '' && (
        <p className="text-xs text-muted-foreground">{jd.recruiter}</p>
      )}
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
        <p className="text-xs whitespace-pre-line text-muted-foreground">
          {jd.description}
        </p>
      )}
      {jd.address !== '' && (
        <p className="text-xs text-muted-foreground">{jd.address}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          记录于 {formatRecordedAt(jd.lastSeenAt)}
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={() => window.open(jd.url, '_blank')}
        >
          <Icons.externalLink data-icon="inline-start" />
          <span>打开职位</span>
        </Button>
      </div>
    </div>
  );
}

// 当前会话卡片：HR 信息在上，JD 手风琴在下；无 JD 时引导跳转抓取
function CurrentSessionCard() {
  const { view } = useCurrentSession();
  const [jdOpen, setJdOpen] = useState(false);

  // 切换当前 HR 的排除标记并广播聊天页重拉遮罩
  const togglePass = async (): Promise<void> => {
    if (view === undefined) {
      return;
    }
    await hrStore.toggleExcluded(view.hr.encryptBossId);
    await sendMessage('hrsChanged', undefined);
  };

  if (view === undefined) {
    return (
      <Card size="sm">
        <CardContent className="text-xs text-muted-foreground">
          在 Boss直聘 打开会话后，这里会显示当前沟通的 HR 与对应职位
        </CardContent>
      </Card>
    );
  }
  const { hr, jd } = view;
  return (
    <Card size="sm" className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-1 text-sm">
          <span className="truncate">{hr.bossName}</span>
          {hr.bossTitle !== '' && (
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {hr.bossTitle}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-2">
            <span className={cn('text-xs font-normal', toneOf(hr.lastMsgAt))}>
              {sinceChatText(hr.lastMsgAt)}
            </span>
            {/* // > Pass 红色警示、恢复中性：排除标记已开显示恢复，未开显示 Pass */}
            <Button
              variant={hr.status === 'excluded' ? 'outline' : 'destructive'}
              size="xs"
              onClick={() => {
                void togglePass();
              }}
            >
              {hr.status === 'excluded' ? '恢复' : 'Pass'}
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {hr.brandName !== '' && (
          <p className="text-xs text-muted-foreground">{hr.brandName}</p>
        )}
        <div className="border-t" />
        {jd === undefined ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              职位未记录：去职位详情页会自动抓取
            </p>
            {hr.encryptJobId !== '' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => window.open(jobUrlOf(hr), '_blank')}
              >
                <Icons.externalLink data-icon="inline-start" />
                <span>去抓取 JD</span>
              </Button>
            )}
          </div>
        ) : (
          <Accordion
            value={jdOpen ? [jd.jobId] : []}
            onValueChange={(values) => {
              setJdOpen(values[0] === jd.jobId);
            }}
          >
            <AccordionItem value={jd.jobId}>
              <AccordionTrigger className="w-full py-1">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {jd.title}
                  </span>
                  <span className="shrink-0 text-primary">{jd.salary}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {/* // > 展开区固定高度：内容多少都占满同一高度，超出部分内部滚动 */}
                <div className="h-60 overflow-y-auto pr-1">
                  <JdDetailSection jd={jd} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export { CurrentSessionCard };
