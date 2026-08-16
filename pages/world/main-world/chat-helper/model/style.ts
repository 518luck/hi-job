// # 注入样式（主世界）：会话遮盖层、总数标签、回复框等页面注入元素的统一样式

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
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
    `.hijob-reply-box{margin:8px 12px 0;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;}`,
    `.hijob-reply-text{margin:6px 0;font-size:13px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-all;}`,
  ].join('\n');
  document.head.append(style);
};

export { ensureStyle, HIJOB_PREFIX };
