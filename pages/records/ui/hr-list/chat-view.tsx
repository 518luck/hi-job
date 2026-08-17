// HR 聊天记录：按时间正序的气泡列表，只展示最近 50 条
import { useLiveQuery } from 'dexie-react-hooks';

import { chatMessageStore } from '@/shared/infra/storage';
import { cn } from '@/shared/lib/cn';

// 最近展示的消息条数：历史过多时只取末尾
const RECENT_MESSAGE_LIMIT = 50;

// 聊天记录展示的 props
interface HrChatViewProps {
  encryptBossId: string;
}

// 格式化消息时间：当天显示时分，其余显示月日；无时间戳显示空
const formatMsgAt = (msgAt: number): string => {
  if (msgAt === 0) {
    return '';
  }
  const date = new Date(msgAt);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
      });
};

// 展开面板里的聊天记录：自己右对齐、HR 左对齐的气泡流
function HrChatView({ encryptBossId }: HrChatViewProps) {
  const messages =
    useLiveQuery(
      () => chatMessageStore.readChatMessagesOf(encryptBossId),
      [encryptBossId],
    ) ?? [];
  const recent = messages.slice(-RECENT_MESSAGE_LIMIT);
  // 按「角色+文本」去重：历史数据中可能残留同内容不同 id 的消息，展示时兜底
  const deduped = [
    ...new Map(
      recent.map((message) => [`${message.role}:${message.text}`, message]),
    ).values(),
  ];

  if (deduped.length === 0) {
    return (
      <p className="px-1 text-muted-foreground">
        暂无聊天消息：打开该会话后自动采集
      </p>
    );
  }
  return (
    // 固定最大高度 + 内部滚动：行高上限确定，虚拟滚动一次测量到位
    <div className="max-h-80 overflow-y-auto">
      <div className="flex flex-col gap-1 px-1">
        {deduped.map((message) => (
          <div
            key={message.msgId}
            className={cn(
              'flex items-end gap-1',
              message.role === 'self' ? 'justify-end' : 'justify-start',
            )}
          >
            {message.role === 'friend' && (
              <span className="shrink-0 text-muted-foreground">
                {formatMsgAt(message.msgAt)}
              </span>
            )}
            <span
              className={cn(
                'max-w-[75%] rounded px-2 py-1 break-words whitespace-pre-line',
                message.role === 'self'
                  ? 'bg-primary/10 text-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {message.text}
            </span>
            {message.role === 'self' && (
              <span className="shrink-0 text-muted-foreground">
                {formatMsgAt(message.msgAt)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { HrChatView };
