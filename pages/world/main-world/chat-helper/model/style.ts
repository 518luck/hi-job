// # 注入样式（主世界）：标记按钮、badge、回复框等页面注入元素的统一样式

// 注入元素统一前缀：类名与标记属性共用，避免与宿主页面冲突
const HIJOB_PREFIX = 'hijob';

// 注入页面样式：hover 显示标记按钮、badge 与辅助组件样式
const ensureStyle = (): void => {
  if (document.querySelector(`style[data-${HIJOB_PREFIX}-style]`) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.hijobStyle = '1';
  style.textContent = [
    `.friend-content .hijob-fail-btn{display:none;margin-left:6px;padding:1px 6px;border:1px solid #f5222d;border-radius:3px;color:#f5222d;font-size:11px;line-height:16px;background:#fff;cursor:pointer;vertical-align:middle;}`,
    `.friend-content:hover .hijob-fail-btn{display:inline-block;}`,
    `.friend-content .hijob-fail-badge{display:inline-block;margin-left:6px;padding:0 5px;border-radius:3px;background:#f5222d;color:#fff;font-size:11px;line-height:16px;vertical-align:middle;}`,
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
    `.hijob-reply-box{margin:8px 12px 0;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;}`,
    `.hijob-reply-text{margin:6px 0;font-size:13px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-all;}`,
  ].join('\n');
  document.head.append(style);
};

export { ensureStyle, HIJOB_PREFIX };
