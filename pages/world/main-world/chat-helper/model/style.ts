// # 注入样式（主世界）：会话遮盖层、总数标签、AI 回复悬浮按钮与聊天窗等注入元素的统一样式
//
// 颜色与弧度对齐侧边栏 shadcn 主题（黑白灰 + 直角）；悬浮按钮贴着恒为浅色的宿主页面，固定浅色玻璃不随系统切换，
// 聊天窗是独立卡片，固定深色一套；变量使用 hijob 前缀，避免与宿主页面同名变量冲突。

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
    // 聊天窗固定深色（不随系统/侧边栏切换）：变量覆盖仅作用于聊天窗子树；
    // 悬浮按钮不在子树内，保持浅色玻璃——它的对比对象是恒为浅色的宿主页面
    '.hijob-chat-window{',
    '--hijob-primary:#fafafa;',
    '--hijob-primary-hover:#ffffff;',
    '--hijob-primary-fg:#18181b;',
    '--hijob-bg:#18181b;',
    '--hijob-fg:#fafafa;',
    '--hijob-muted:#27272a;',
    '--hijob-muted-fg:#a1a1aa;',
    '--hijob-border:#3f3f46;',
    '}',
    '.friend-content{position:relative;}',
    '.hijob-pass-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);color:#999;font-size:14px;font-weight:600;letter-spacing:1px;z-index:5;}',
    '.hijob-since-chat{float:right;margin-right:6px;color:#999;font-size:11px;}',
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
    // AI 回复悬浮按钮：液态玻璃胶囊（liquid-glass 三层方案）——::after 承载「模糊背景 + SVG 噪声位移」的折射层（z-index:-1），
    // ::before 叠玻璃染色与内侧高光，文字浮于最上；宿主页面恒为浅色，文字与描边用深色保证对比；可拖拽，点击切换聊天窗
    `.hijob-svg-defs{position:absolute;width:0;height:0;overflow:hidden;}`,
    `.hijob-reply-fab{position:fixed;left:16px;bottom:56px;z-index:2147483646;padding:9px 18px;border:1px solid rgba(24,24,27,.08);border-radius:999px;background:transparent;color:var(--hijob-fg);font-size:13px;font-weight:600;cursor:grab;user-select:none;touch-action:none;isolation:isolate;box-shadow:0 6px 24px rgba(0,0,0,.2);transition:box-shadow .15s,transform .15s;}`,
    `.hijob-reply-fab::before{content:'';position:absolute;inset:0;z-index:0;border-radius:999px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 20px -5px rgba(255,255,255,.7);}`,
    `.hijob-reply-fab::after{content:'';position:absolute;inset:0;z-index:-1;border-radius:999px;backdrop-filter:blur(2px);filter:url(#${HIJOB_PREFIX}-glass-distortion);}`,
    `.hijob-fab-label{position:relative;z-index:1;}`,
    `.hijob-reply-fab:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(0,0,0,.25);}`,
    `.hijob-reply-fab:active{cursor:grabbing;transform:translateY(0);box-shadow:0 4px 12px rgba(0,0,0,.18);}`,
    // AI 回复聊天窗：悬浮面板，标题栏 + 正文 + 操作区，颜色随主题
    // > display:flex 会压过浏览器默认的 [hidden] 规则，需显式声明隐藏态
    `.hijob-chat-window[hidden]{display:none;}`,
    `.hijob-chat-window{position:fixed;left:16px;bottom:112px;z-index:2147483646;width:340px;height:420px;display:flex;flex-direction:column;border:1px solid var(--hijob-border);border-radius:0;background:var(--hijob-bg);color:var(--hijob-fg);box-shadow:0 8px 32px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;}`,
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
    // 未授权错误的「去授权」按钮：主色实底强调，独占一行不与错误文案混排
    `.hijob-auth-button{display:block;margin-top:10px;padding:6px 16px;border:1px solid transparent;border-radius:6px;background:var(--hijob-primary);color:var(--hijob-primary-fg);font-size:12px;cursor:pointer;white-space:nowrap;}`,
    // 按钮悬停气泡：深浅色反转强调，随主题切换，不拦截鼠标事件
    `.hijob-button-tooltip{position:absolute;z-index:2;max-width:300px;padding:8px 10px;border:1px solid var(--hijob-border);background:var(--hijob-fg);color:var(--hijob-bg);font-size:12px;line-height:1.6;transform:translateX(-50%);box-shadow:0 2px 8px rgba(0,0,0,.18);pointer-events:none;}`,
    `.hijob-tooltip-title{font-weight:600;}`,
  ].join('\n');
  document.head.append(style);
};

export { ensureStyle, HIJOB_PREFIX };
