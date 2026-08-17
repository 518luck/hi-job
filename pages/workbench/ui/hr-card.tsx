// # 当前 HR 卡：最近打开的 HR 档案 + 关联职位与未沟通时长

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import type { Hr, RecordedJd } from '@/shared/zod';

// 当前 HR 卡的 props：jd 缺省表示职位未记录
interface HrCardProps {
  hr: Hr;
  jd?: RecordedJd;
  excluded: boolean;
  onToggleExcluded: () => void;
}

// 距上次沟通的时长文案：刚刚 / N 分钟 / N 小时 / N 天
const sinceChatText = (lastMsgAt: number): string => {
  const minutes = Math.floor((Date.now() - lastMsgAt) / 60_000);
  if (minutes < 1) {
    return '刚刚沟通';
  }
  if (minutes < 60) {
    return `${minutes} 分钟未沟通`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时未沟通`;
  }
  return `${Math.floor(hours / 24)} 天未沟通`;
};

// 当前 HR 卡：HR 概要与排除标记，关联职位以手风琴展开详情
function HrCard({ hr, jd, excluded, onToggleExcluded }: HrCardProps) {
  return (
    // 当前 HR 卡用主题色浅底与描边，与下方列表卡区分
    <Card size="sm" className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{hr.bossName}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <Badge variant="secondary">
            {sinceChatText(hr.lastMsgAt || hr.lastChatAt)}
          </Badge>
          <Button
            variant="destructive"
            size="xs"
            className={
              excluded
                ? 'bg-green-600/10 text-green-600 hover:bg-green-600/20 focus-visible:border-green-600/40 focus-visible:ring-green-600/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30'
                : undefined
            }
            onClick={onToggleExcluded}
          >
            {excluded ? '恢复' : 'Pass'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {hr.bossTitle !== '' && (
            <Badge variant="outline">{hr.bossTitle}</Badge>
          )}
          {hr.brandName !== '' && (
            <Badge variant="outline">{hr.brandName}</Badge>
          )}
        </div>

        {hr.lastText !== '' && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {hr.lastIsSelf ? '我' : 'HR'}：{hr.lastText}
          </p>
        )}

        <div className="border-t" />

        {jd === undefined ? (
          <p className="text-xs text-muted-foreground">
            职位未记录：在职位列表点开后自动补充
          </p>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="min-w-0 truncate text-sm font-medium">
                {jd.title}
              </span>
              <Badge variant="secondary">{jd.salary}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {[jd.companyScale, jd.companyIndustry]
                .filter((item) => item !== '')
                .join(' · ')}
            </p>
            <Accordion multiple={false}>
              <AccordionItem value="jd-detail">
                <AccordionTrigger className="text-muted-foreground">
                  招聘详情
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-1 text-muted-foreground">
                  {jd.tags.length > 0 && <div>{jd.tags.join(' · ')}</div>}
                  <div className="whitespace-pre-wrap">{jd.description}</div>
                  {jd.address !== '' && <div>{jd.address}</div>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { HrCard };
