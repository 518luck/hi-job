// # 未沟通时长工具：天数、文案与提示色
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

export { sinceChatText, sinceDays, toneOf };
