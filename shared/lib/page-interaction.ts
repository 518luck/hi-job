// # 页面交互工具：内容脚本对宿主页面的等待、拟人延迟与提示反馈

// 点击前随机延迟区间：模拟人扫一眼页面再动手，降低风控特征
const CLICK_DELAY_MIN_MS = 500;
const CLICK_DELAY_MAX_MS = 1200;

// toast 提示类名与自动消失时长：页面右下角短暂提示
const TOAST_CLASS = 'hijob-greet-toast';
const TOAST_DISMISS_MS = 4000;

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

// 注入 toast 样式：深色小条，贴页面右下角
const ensureToastStyle = (): void => {
  if (document.querySelector(`style[data-hijob-greet-style]`) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.hijobGreetStyle = '1';
  style.textContent = `.${TOAST_CLASS}{position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:10px 14px;border-radius:4px;background:rgba(24,24,27,.92);color:#fafafa;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.25);}`;
  document.head.append(style);
};

// 页面右下角短暂提示：自动流程的结果或失败原因反馈
const showToast = ({ text }: { text: string }): void => {
  ensureToastStyle();
  const toast = document.createElement('div');
  toast.className = TOAST_CLASS;
  toast.textContent = text;
  document.body.append(toast);
  setTimeout(() => toast.remove(), TOAST_DISMISS_MS);
};

export { randomDelay, showToast, waitForVisible };
