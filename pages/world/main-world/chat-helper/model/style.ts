// # 注入样式（主世界）：会话遮盖层、总数标签、AI 回复悬浮按钮与聊天窗等注入元素的统一样式
//
// 颜色与弧度对齐侧边栏 shadcn 主题（黑白灰 + 直角），明暗随系统 prefers-color-scheme 切换；
// 变量使用 hijob 前缀，避免与宿主页面同名变量冲突。

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
    ':root{',
    '--hijob-primary:#18181b;',
    '--hijob-primary-hover:#000000;',
    '--hijob-primary-fg:#fafafa;',
    '--hijob-bg:#ffffff;',
    '--hijob-fg:#18181b;',
    '--hijob-muted:#f4f4f5;',
    '--hijob-muted-fg:#71717a;',
    '--hijob-border:#e4e4e7;',
    '--hijob-danger:#dc2626;',
    '}',
    '@media (prefers-color-scheme: dark){',
    ':root{',
    '--hijob-primary:#fafafa;',
    '--hijob-primary-hover:#ffffff;',
    '--hijob-primary-fg:#18181b;',
    '--hijob-bg:#18181b;',
    '--hijob-fg:#fafafa;',
    '--hijob-muted:#27272a;',
    '--hijob-muted-fg:#a1a1aa;',
    '--hijob-border:#3f3f46;',
    '}',
    '}',
    '.friend-content{position:relative;}',
    '.hijob-pass-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);color:#999;font-size:14px;font-weight:600;letter-spacing:1px;z-index:5;}',
    '.hijob-since-chat{float:right;margin-right:6px;color:#999;font-size:11px;}',
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
    // AI 回复悬浮按钮：shadcn 直角与主色，可拖拽，点击切换聊天窗
    `.hijob-reply-fab{position:fixed;right:16px;bottom:56px;z-index:2147483646;padding:8px 16px;border:1px solid transparent;border-radius:0;background:var(--hijob-primary);color:var(--hijob-primary-fg);font-size:13px;font-weight:500;cursor:grab;user-select:none;touch-action:none;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:background .15s,box-shadow .15s;}`,
    `.hijob-reply-fab:hover{background:var(--hijob-primary-hover);}`,
    `.hijob-reply-fab:active{cursor:grabbing;box-shadow:0 1px 4px rgba(0,0,0,.2);}`,
    // AI 回复聊天窗：悬浮面板，标题栏 + 正文 + 操作区，颜色随主题
    // > display:flex 会压过浏览器默认的 [hidden] 规则，需显式声明隐藏态
    `.hijob-chat-window[hidden]{display:none;}`,
    `.hijob-chat-window{position:fixed;right:16px;bottom:112px;z-index:2147483646;width:340px;height:420px;display:flex;flex-direction:column;border:1px solid var(--hijob-border);border-radius:0;background:var(--hijob-bg);color:var(--hijob-fg);box-shadow:0 8px 32px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;}`,
    `.hijob-chat-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--hijob-border);background:var(--hijob-muted);font-size:13px;font-weight:600;color:var(--hijob-fg);}`,
    `.hijob-chat-close{padding:2px 8px;border:none;border-radius:0;background:transparent;color:var(--hijob-muted-fg);font-size:16px;line-height:1;cursor:pointer;transition:background .15s,color .15s;}`,
    `.hijob-chat-close:hover{background:var(--hijob-border);color:var(--hijob-danger);}`,
    `.hijob-chat-body{flex:1;overflow-y:auto;padding:12px 14px;font-size:13px;line-height:1.8;color:var(--hijob-fg);white-space:pre-wrap;word-break:break-all;}`,
    // 生成中的旋转加载图标：不占文本空间，避免换行撑高；出现时正文居中
    `.hijob-loading-spinner{display:inline-block;width:20px;height:20px;border:2px solid var(--hijob-border);border-top-color:var(--hijob-primary);border-radius:50%;animation:hijob-spin .8s linear infinite;}`,
    `@keyframes hijob-spin{to{transform:rotate(360deg);}}`,
    `.hijob-chat-body:has(.hijob-loading-spinner){display:flex;align-items:center;justify-content:center;}`,
    // 按钮内的旋转加载图标：颜色跟随按钮文字，不占宽度
    `.hijob-button-spinner{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;opacity:.8;animation:hijob-spin .8s linear infinite;vertical-align:middle;}`,
    `.hijob-chat-body::-webkit-scrollbar{width:6px;}`,
    `.hijob-chat-body::-webkit-scrollbar-thumb{background:var(--hijob-border);border-radius:3px;}`,
    `.hijob-chat-body::-webkit-scrollbar-thumb:hover{background:var(--hijob-muted-fg);}`,
    `.hijob-chat-footer{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--hijob-border);background:var(--hijob-muted);}`,
    `.hijob-reply-button{flex:1;padding:6px 12px;border:1px solid transparent;border-radius:6px;background:var(--hijob-primary);color:var(--hijob-primary-fg);font-size:12px;cursor:pointer;transition:background .15s;}`,
    `.hijob-reply-button:hover:not(:disabled){background:var(--hijob-primary-hover);}`,
    `.hijob-reply-button:disabled{opacity:.6;cursor:not-allowed;}`,
    `.hijob-copy-button{flex:1;padding:6px 12px;border:1px solid var(--hijob-border);border-radius:6px;background:transparent;color:var(--hijob-fg);font-size:12px;cursor:pointer;transition:background .15s,border-color .15s;}`,
    `.hijob-copy-button:hover{background:var(--hijob-muted);border-color:var(--hijob-muted-fg);}`,
    // 按钮悬停气泡：深浅色反转强调，随主题切换，不拦截鼠标事件
    `.hijob-button-tooltip{position:absolute;z-index:2;max-width:300px;padding:8px 10px;border:1px solid var(--hijob-border);background:var(--hijob-fg);color:var(--hijob-bg);font-size:12px;line-height:1.6;transform:translateX(-50%);box-shadow:0 2px 8px rgba(0,0,0,.18);pointer-events:none;}`,
    `.hijob-tooltip-title{font-weight:600;}`,
  ].join('\n');
  document.head.append(style);
};

export { ensureStyle, HIJOB_PREFIX };
