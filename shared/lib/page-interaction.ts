// # 页面交互工具：内容脚本对宿主页面的等待、拟人延迟与提示反馈

// 点击前随机延迟区间：模拟人扫一眼页面再动手，降低风控特征
const CLICK_DELAY_MIN_MS = 500;
const CLICK_DELAY_MAX_MS = 1200;

// toast 提示类名与时长：右下角液态玻璃小条，退场动画占尾段
const TOAST_CLASS = 'hijob-toast';
const TOAST_DISMISS_MS = 4000;
const TOAST_EXIT_MS = 200;

// 随机等待一小段：自动化点击前的拟人延迟
const randomDelay = (): Promise<void> =>
  new Promise((resolve) => {
    const ms =
      CLICK_DELAY_MIN_MS +
      Math.random() * (CLICK_DELAY_MAX_MS - CLICK_DELAY_MIN_MS);
    setTimeout(resolve, ms);
  });

// 轮询等待定位函数命中可见元素（offsetWidth 有值），超时返回 null
const waitForVisible = async ({
  locate,
  timeoutMs,
}: {
  locate: () => HTMLElement | null;
  timeoutMs: number;
}): Promise<HTMLElement | null> => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const element = locate();
    if (element !== null) {
      return element;
    }
    if (Date.now() >= deadline) {
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
};

// 注入 toast 样式：毛玻璃底 + 细描边 + 状态指示灯，视觉对齐聊天窗；入场/退场带动画且尊重减弱动效
const ensureToastStyle = (): void => {
  if (document.querySelector(`style[data-hijob-toast-style]`) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.hijobToastStyle = '1';
  style.textContent = `
.${TOAST_CLASS}-stack{position:fixed;right:20px;bottom:20px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;}
.${TOAST_CLASS}{display:flex;align-items:center;gap:8px;max-width:280px;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(24,26,32,.6);backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08);color:rgba(250,250,250,.92);font-size:13px;line-height:1.45;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;animation:hijob-toast-in .24s cubic-bezier(.32,.72,0,1) both;}
.${TOAST_CLASS}.is-exit{animation:hijob-toast-out .2s ease both;}
.${TOAST_CLASS}-dot{width:6px;height:6px;border-radius:2px;flex:none;background:#34d399;}
.${TOAST_CLASS}.is-error .${TOAST_CLASS}-dot{background:#f87171;}
@keyframes hijob-toast-in{from{opacity:0;transform:translateY(8px) scale(.96);}to{opacity:1;transform:none;}}
@keyframes hijob-toast-out{from{opacity:1;transform:none;}to{opacity:0;transform:translateY(4px);}}
@media (prefers-reduced-motion: reduce){.${TOAST_CLASS}{animation:none;}}`;
  document.head.append(style);
};

// 确保 toast 堆叠容器存在：多条提示自下而上堆叠，不互相覆盖
const ensureToastStack = (): HTMLElement => {
  const existing = document.querySelector<HTMLElement>(`.${TOAST_CLASS}-stack`);
  if (existing !== null) {
    return existing;
  }
  const stack = document.createElement('div');
  stack.className = `${TOAST_CLASS}-stack`;
  document.body.append(stack);
  return stack;
};

// toast 提示入参
interface ShowToastOptions {
  text: string; // 提示文案
  tone?: 'ok' | 'error'; // 语气：默认 ok（绿灯），失败用 error（红灯）
}

// 页面右下角玻璃小条提示：自动流程的结果或失败原因反馈，带状态灯与出入场动画
const showToast = ({ text, tone = 'ok' }: ShowToastOptions): void => {
  ensureToastStyle();
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `${TOAST_CLASS}${tone === 'error' ? ' is-error' : ''}`;
  const dot = document.createElement('span');
  dot.className = `${TOAST_CLASS}-dot`;
  toast.append(dot, document.createTextNode(text));
  stack.append(toast);
  setTimeout(() => {
    toast.classList.add('is-exit');
    setTimeout(() => toast.remove(), TOAST_EXIT_MS);
  }, TOAST_DISMISS_MS - TOAST_EXIT_MS);
};

export { randomDelay, showToast, waitForVisible };
