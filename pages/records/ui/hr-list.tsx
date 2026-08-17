import { cn } from '@/shared/lib/cn';
import type { Hr } from '@/shared/zod';

// HR 列表的 props
interface HrListProps {
  hrList: Hr[];
}

// 未沟通天数：满 3 天橙色提醒，满 7 天红色警示；无时间戳视为 0（不误标色）
const sinceDays = (lastMsgAt: number): number =>
  lastMsgAt <= 0 ? 0 : Math.floor((Date.now() - lastMsgAt) / 86_400_000);

// 距上次沟通的时长文案：刚刚 / N 分钟 / N 小时 / N 天未沟通，超 30 天显示日期
const sinceChatText = (lastMsgAt: number): string => {
  if (lastMsgAt === 0) {
    return '未知';
  }
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
  const days = Math.floor(hours / 24);
  if (days >= 30) {
    return new Date(lastMsgAt).toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
    });
  }
  return `${days} 天未沟通`;
};

// HR 列表：按最后沟通时间倒序展示招聘者，标出未沟通时长、等你回复与已排除
function HrList({ hrList }: HrListProps) {
  if (hrList.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有聊过的 HR：在 Boss直聘 打开「沟通」页，联系人会自动同步过来
      </p>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {hrList.map((hr) => {
        const excluded = hr.status === 'excluded';
        const days = sinceDays(hr.lastMsgAt);
        const tone =
          days >= 7
            ? 'text-red-600 dark:text-red-400'
            : days >= 3
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-muted-foreground';
        const waiting = hr.lastIsSelf && days >= 1;
        return (
          <div
            key={hr.encryptBossId}
            className={cn(
              'flex items-start gap-2 py-2',
              excluded && 'opacity-50',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1">
                <span
                  className={cn('truncate text-sm', excluded && 'line-through')}
                >
                  {hr.bossName}
                </span>
                {hr.bossTitle !== '' && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {hr.bossTitle}
                  </span>
                )}
                {excluded && (
                  <span className="shrink-0 rounded bg-muted px-1 text-xs text-muted-foreground">
                    已排除
                  </span>
                )}
                {waiting && (
                  <span className="shrink-0 rounded bg-orange-600/10 px-1 text-xs text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    等你回复
                  </span>
                )}
              </div>
              {hr.brandName !== '' && (
                <p className="truncate text-xs text-muted-foreground">
                  {hr.brandName}
                </p>
              )}
              {hr.lastText !== '' && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {hr.lastText}
                </p>
              )}
            </div>
            <span className={cn('shrink-0 text-xs', tone)}>
              {sinceChatText(hr.lastMsgAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { HrList };
