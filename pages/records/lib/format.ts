// # 记录页时间格式化工具
// 格式化最近出现时间：当天显示时分，其余显示月日
const formatSeenAt = (timestamp: number): string => {
  const date = new Date(timestamp);
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

export { formatSeenAt };
