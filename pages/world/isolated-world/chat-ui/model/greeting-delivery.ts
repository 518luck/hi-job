// # 问候投递（隔离世界）：把生成的问候文本填入 Boss 聊天输入框，可选自动点击发送

import {
  randomDelay,
  showToast,
  waitForVisible,
} from '@/shared/lib/page-interaction';

// Boss 聊天输入框（contenteditable）与发送按钮选择器
const CHAT_INPUT_SELECTOR = '#chat-input';
const SEND_BUTTON_SELECTOR = '.btn-send';

// 输入框与发送按钮的等待超时：页面未就绪或结构变化时放弃投递
const DELIVERY_WAIT_TIMEOUT_MS = 3000;

// 投递结果：填入未发送 / 已发送 / 失败（带原因）
type GreetingDeliveryResult =
  | { outcome: 'filled' }
  | { outcome: 'sent' }
  | { outcome: 'failed'; reason: string };

// 定位可见的 Boss 聊天输入框
const locateChatInput = (): HTMLElement | null => {
  const input = document.querySelector<HTMLElement>(CHAT_INPUT_SELECTOR);
  return input !== null && input.offsetWidth > 0 ? input : null;
};

// 定位已启用的发送按钮：Boss 用 disabled 类名控制可发状态
const locateEnabledSendButton = (): HTMLElement | null => {
  const button = document.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR);
  if (button === null || button.offsetWidth <= 0) {
    return null;
  }
  return button.classList.contains('disabled') ? null : button;
};

// 把文本写入 contenteditable 输入框：全选后 execCommand 整体替换，会触发原生 input 事件链让页面 Vue 感知
const writeChatInput = ({
  input,
  text,
}: {
  input: HTMLElement;
  text: string;
}): boolean => {
  input.focus();
  const selection = window.getSelection();
  if (selection !== null) {
    const range = document.createRange();
    range.selectNodeContents(input);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  // execCommand 虽已标记弃用，但仍是向 contenteditable 注入文本并触发 input 事件的最可靠方式
  if (document.execCommand('insertText', false, text)) {
    return true;
  }
  // 回退：直接改内容并手动派发 input 事件
  input.textContent = text;
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  return input.textContent === text;
};

// 投递问候：填入输入框 → 等发送按钮启用 → autoSend 时拟人延迟后点击发送，全程 toast 反馈
const deliverGreeting = async ({
  text,
  autoSend,
}: {
  text: string;
  autoSend: boolean;
}): Promise<GreetingDeliveryResult> => {
  if (text.trim() === '') {
    showToast({ text: '问候内容为空，未填入输入框' });
    return { outcome: 'failed', reason: 'empty-text' };
  }
  const input = await waitForVisible({
    locate: locateChatInput,
    timeoutMs: DELIVERY_WAIT_TIMEOUT_MS,
  });
  if (input === null) {
    showToast({ text: '未找到聊天输入框，请手动粘贴问候' });
    return { outcome: 'failed', reason: 'input-not-found' };
  }
  const written = writeChatInput({ input, text });
  const sendButton = await waitForVisible({
    locate: locateEnabledSendButton,
    timeoutMs: DELIVERY_WAIT_TIMEOUT_MS,
  });
  if (!written || sendButton === null) {
    showToast({ text: '问候填入输入框失败，请手动粘贴' });
    return {
      outcome: 'failed',
      reason: written ? 'send-disabled' : 'write-failed',
    };
  }
  if (!autoSend) {
    showToast({ text: '问候已填入输入框，确认后手动发送' });
    return { outcome: 'filled' };
  }
  await randomDelay();
  sendButton.click();
  showToast({ text: '问候已自动发送' });
  return { outcome: 'sent' };
};

export type { GreetingDeliveryResult };
export { deliverGreeting, locateChatInput };
