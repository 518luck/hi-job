// HR 列表列定义：两列布局，左列信息堆叠、右列时长与状态，时长列按时间戳排序
import type { ColumnDef } from '@tanstack/react-table';

import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import type { Hr } from '@/shared/zod';

import type { features } from '../data-table';

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

// 未沟通时长的提示色：满 7 天红色、满 3 天橙色、其余默认灰
const toneOf = (lastMsgAt: number): string => {
  const days = sinceDays(lastMsgAt);
  if (days >= 7) {
    return 'text-red-600 dark:text-red-400';
  }
  if (days >= 3) {
    return 'text-orange-600 dark:text-orange-400';
  }
  return 'text-muted-foreground';
};

// HR 列表列定义：左列堆叠姓名/公司/最后消息，右列时长+状态并按时长排序
const hrColumns: ColumnDef<typeof features, Hr>[] = [
  {
    id: 'info',
    header: 'HR',
    cell: ({ row }) => {
      const { bossName, bossTitle, brandName, lastText, status } =
        row.original;
      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'truncate font-medium',
                status === 'excluded' && 'line-through',
              )}
            >
              {bossName}
            </span>
            {bossTitle !== '' && (
              <span className="shrink-0 text-muted-foreground">
                {bossTitle}
              </span>
            )}
          </div>
          {brandName !== '' && (
            <p className="truncate text-muted-foreground">{brandName}</p>
          )}
          {lastText !== '' && (
            <p className="truncate text-muted-foreground">{lastText}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'lastMsgAt',
    header: '状态',
    cell: ({ row }) => {
      const { status, lastIsSelf } = row.original;
      return (
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className={toneOf(row.original.lastMsgAt)}>
            {sinceChatText(row.original.lastMsgAt)}
          </span>
          <div className="flex gap-1">
            {status === 'excluded' && (
              <Badge variant="secondary">已排除</Badge>
            )}
            {lastIsSelf && sinceDays(row.original.lastMsgAt) >= 1 && (
              <Badge className="bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                等你回复
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
];

export { hrColumns };