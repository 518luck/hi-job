// # 注入样式（主世界）：会话遮盖层、总数标签等页面标记类注入元素的统一样式
//
// 聊天窗与悬浮按钮已迁至隔离世界（React + Shadow Root），此处只保留与宿主页面 DOM 交互的标记样式。

// 注入元素统一前缀：类名与标记属性共用，避免与宿主页面冲突
const HIJOB_PREFIX = 'hijob';

// 注入页面样式：已 Pass 会话的遮盖层与辅助组件样式
const ensureStyle = (): void => {
  if (document.querySelector(`style[data-${HIJOB_PREFIX}-style]`) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.hijobStyle = '1';
  style.textContent = [
    '.friend-content{position:relative;}',
    '.hijob-pass-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);color:#999;font-size:14px;font-weight:600;letter-spacing:1px;z-index:5;}',
    '.hijob-since-chat{float:right;margin-right:6px;color:#999;font-size:11px;}',
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
  ].join('\n');
  document.head.append(style);
};

export { ensureStyle, HIJOB_PREFIX };
