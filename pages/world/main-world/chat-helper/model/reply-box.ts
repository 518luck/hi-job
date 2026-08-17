// # AI 回复助手（主世界）：悬浮按钮 + 聊天窗，问候/跟进/反馈/回复/复制
import { stringOf } from '@/shared/lib/page-property';

import { extensionApi } from './background-rpc';
import { HIJOB_PREFIX } from './style';
import {
  hrOf,
  readCurrentBossWithRetry,
  readMessagesWithRetry,
  replyJdOf,
} from './vue-reader';

// 聊天窗尺寸：与 style.ts 中 .hijob-chat-window 保持一致，用于定位计算
const CHAT_WINDOW_WIDTH = 340;
const CHAT_WINDOW_HEIGHT = 420;

// 正文区显示生成中的旋转加载图标，替代文本提示避免换行撑高
const showLoading = (bodyEl: HTMLElement): void => {
  bodyEl.replaceChildren();
  const spinner = document.createElement('span');
  spinner.className = `${HIJOB_PREFIX}-loading-spinner`;
  bodyEl.append(spinner);
};

// 按钮内容切换为旋转加载图标：生成中不显示文字，避免换行撑高
const showButtonLoading = (button: HTMLButtonElement): void => {
  button.replaceChildren();
  const spinner = document.createElement('span');
  spinner.className = `${HIJOB_PREFIX}-button-spinner`;
  button.append(spinner);
};

// 恢复按钮文字
const restoreButtonText = (button: HTMLButtonElement, text: string): void => {
  button.replaceChildren();
  button.textContent = text;
};

// 生成下一条回复：收集当前会话信息与聊天记录，经后台生成后展示在聊天窗正文
const handleGenerateReply = async (
  bodyEl: HTMLElement,
  generateButton: HTMLButtonElement,
): Promise<void> => {
  const boss = await readCurrentBossWithRetry();
  if (boss === null) {
    bodyEl.textContent = '未找到当前会话信息';
    return;
  }
  const messages = await readMessagesWithRetry();
  if (messages.length === 0) {
    bodyEl.textContent = '暂无聊天记录（页面可能还在加载）';
    return;
  }
  // 生成中禁用按钮并显示加载图标，结束后恢复
  generateButton.disabled = true;
  showButtonLoading(generateButton);
  showLoading(bodyEl);
  try {
    const response = await extensionApi.generateReply({
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      messages,
      hr: hrOf(boss),
    });
    bodyEl.textContent = response;
  } catch (error) {
    bodyEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  } finally {
    generateButton.disabled = false;
    restoreButtonText(generateButton, '回复');
  }
};

// 生成打招呼语句：首次联系时，结合 JD 与 HR 信息经后台生成
const handleGreeting = async (
  bodyEl: HTMLElement,
  greetingButton: HTMLButtonElement,
): Promise<void> => {
  const boss = await readCurrentBossWithRetry();
  if (boss === null) {
    bodyEl.textContent = '未找到当前会话信息';
    return;
  }
  greetingButton.disabled = true;
  showButtonLoading(greetingButton);
  showLoading(bodyEl);
  try {
    const response = await extensionApi.greeting({
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      hr: hrOf(boss),
    });
    bodyEl.textContent = response;
  } catch (error) {
    bodyEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  } finally {
    greetingButton.disabled = false;
    restoreButtonText(greetingButton, '问候');
  }
};

// 生成跟进消息：读取当前页面最近聊天记录并经后台生成自然提醒
const handleFollowUp = async (
  bodyEl: HTMLElement,
  followUpButton: HTMLButtonElement,
): Promise<void> => {
  const boss = await readCurrentBossWithRetry();
  if (boss === null) {
    bodyEl.textContent = '未找到当前会话信息';
    return;
  }
  const messages = await readMessagesWithRetry();
  if (messages.length === 0) {
    bodyEl.textContent = '暂无聊天记录（页面可能还在加载）';
    return;
  }
  // 仅在最后一条消息由求职者发出时跟进，招聘者刚回复时应直接作答
  if (messages.at(-1)?.role !== 'self') {
    bodyEl.textContent = '招聘者刚刚发来消息：请使用“回复”继续沟通';
    return;
  }
  followUpButton.disabled = true;
  showButtonLoading(followUpButton);
  showLoading(bodyEl);
  try {
    const response = await extensionApi.followUp({
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      messages,
      hr: hrOf(boss),
    });
    bodyEl.textContent = response;
  } catch (error) {
    bodyEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  } finally {
    followUpButton.disabled = false;
    restoreButtonText(followUpButton, '提醒');
  }
};

interface RejectionFeedbackHandlerOptions {
  bodyEl: HTMLElement;
  feedbackButton: HTMLButtonElement;
}

// 生成请教反馈消息：读取当前会话职位信息与最近聊天记录，经后台生成反馈请求
const handleRejectionFeedback = async ({
  bodyEl,
  feedbackButton,
}: RejectionFeedbackHandlerOptions): Promise<void> => {
  feedbackButton.disabled = true;
  showButtonLoading(feedbackButton);
  showLoading(bodyEl);

  let conversationId = '';
  try {
    const boss = await readCurrentBossWithRetry();
    if (boss === null) {
      bodyEl.textContent = '未找到当前会话信息';
      return;
    }
    conversationId = stringOf(boss, 'encryptBossId');
    if (conversationId === '') {
      bodyEl.textContent = '未找到当前会话标识';
      return;
    }
    const messages = await readMessagesWithRetry();
    if (messages.length === 0) {
      bodyEl.textContent = '暂无聊天记录（页面可能还在加载）';
      return;
    }
    const currentBoss = await readCurrentBossWithRetry();
    if (
      currentBoss === null ||
      stringOf(currentBoss, 'encryptBossId') !== conversationId
    ) {
      bodyEl.textContent = '会话已切换，请在当前会话中重新操作';
      return;
    }

    const response = await extensionApi.rejectionFeedback({
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      messages,
      hr: hrOf(boss),
    });
    const latestBoss = await readCurrentBossWithRetry();
    if (
      latestBoss === null ||
      stringOf(latestBoss, 'encryptBossId') !== conversationId
    ) {
      bodyEl.textContent = '会话已切换，已忽略上一会话的生成结果';
      return;
    }
    bodyEl.textContent = response;
  } catch (error) {
    const latestBoss = await readCurrentBossWithRetry();
    const latestConversationId =
      latestBoss === null ? '' : stringOf(latestBoss, 'encryptBossId');
    if (conversationId !== '' && latestConversationId !== conversationId) {
      bodyEl.textContent = '会话已切换，已忽略上一会话的生成结果';
      return;
    }
    bodyEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  } finally {
    feedbackButton.disabled = false;
    restoreButtonText(feedbackButton, '反馈');
  }
};

// 复制聊天窗正文到剪贴板，按钮短暂切换文案
const copyReplyText = async (
  bodyEl: HTMLElement,
  copyButton: HTMLButtonElement,
): Promise<void> => {
  await navigator.clipboard.writeText(bodyEl.textContent ?? '');
  copyButton.textContent = '已复制';
  setTimeout(() => {
    copyButton.textContent = '复制';
  }, 1500);
};

// 聊天窗定位：打开时放到悬浮按钮附近，优先上方、放不下则下方，水平不超出视口
const positionChatWindow = (chatWindow: HTMLElement): void => {
  const fab = document.querySelector<HTMLElement>(
    `[data-${HIJOB_PREFIX}-reply-fab]`,
  );
  if (fab === null) {
    return;
  }
  const rect = fab.getBoundingClientRect();
  const gap = 12;
  chatWindow.style.top =
    rect.top - CHAT_WINDOW_HEIGHT - gap >= 0
      ? `${rect.top - CHAT_WINDOW_HEIGHT - gap}px`
      : `${rect.bottom + gap}px`;
  chatWindow.style.bottom = 'auto';
  chatWindow.style.right = `${Math.min(
    Math.max(window.innerWidth - rect.right, 8),
    window.innerWidth - CHAT_WINDOW_WIDTH - 8,
  )}px`;
  chatWindow.style.left = 'auto';
};

// 悬浮按钮拖拽：按住拖动改变位置，位移超过阈值视为拖拽（不触发点击）
const enableFabDrag = (
  fab: HTMLButtonElement,
  chatWindow: HTMLElement,
): void => {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let pressed = false;
  let dragging = false;

  fab.addEventListener('pointerdown', (event) => {
    const rect = fab.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    pressed = true;
    dragging = false;
    fab.setPointerCapture(event.pointerId);
  });

  fab.addEventListener('pointermove', (event) => {
    // 仅按住时处理移动：悬停移动不触发，避免按钮「逃跑」
    if (!pressed) {
      return;
    }
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    // 位移阈值：低于此值视为点击抖动，不触发拖拽
    if (Math.abs(dx) <= 6 && Math.abs(dy) <= 6) {
      return;
    }
    dragging = true;
    // 拖动位置限制在视口内；设 left/top 后样式里的 right/bottom 自动失效
    fab.style.left = `${Math.min(
      Math.max(startLeft + dx, 0),
      window.innerWidth - fab.offsetWidth,
    )}px`;
    fab.style.top = `${Math.min(
      Math.max(startTop + dy, 0),
      window.innerHeight - fab.offsetHeight,
    )}px`;
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    // 聊天窗展开时跟随按钮移动，始终保持在其附近
    if (!chatWindow.hidden) {
      positionChatWindow(chatWindow);
    }
  });

  fab.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = false;
      pressed = false;
      return;
    }
    // 未发生拖拽视为点击：切换聊天窗展开/收起，展开时重新定位到按钮附近
    if (chatWindow.hidden) {
      positionChatWindow(chatWindow);
      chatWindow.hidden = false;
    } else {
      chatWindow.hidden = true;
    }
    pressed = false;
  });

  fab.addEventListener('pointercancel', () => {
    pressed = false;
    dragging = false;
  });
};

// 注入悬浮按钮与聊天窗：右下角悬浮按钮，可拖拽移动，点击切换聊天窗显示
const ensureReplyBox = (): void => {
  const conversation = document.querySelector('.chat-conversation');
  if (conversation === null) {
    return;
  }
  if (document.querySelector(`[data-${HIJOB_PREFIX}-reply-fab]`) !== null) {
    return;
  }

  // 悬浮按钮：点击展开/收起聊天窗，可拖拽改变位置
  const fab = document.createElement('button');
  fab.dataset.hijobReplyFab = '1';
  fab.className = `${HIJOB_PREFIX}-reply-fab`;
  fab.textContent = 'AI 回复';
  document.body.append(fab);

  // 聊天窗骨架：标题栏 + 正文 + 操作区（生成/复制）
  const chatWindow = document.createElement('div');
  chatWindow.className = `${HIJOB_PREFIX}-chat-window`;
  chatWindow.hidden = true;

  const header = document.createElement('div');
  header.className = `${HIJOB_PREFIX}-chat-header`;
  const title = document.createElement('span');
  title.textContent = 'AI 回复';
  const close = document.createElement('button');
  close.className = `${HIJOB_PREFIX}-chat-close`;
  close.textContent = '×';
  close.setAttribute('aria-label', '关闭');
  close.addEventListener('click', () => {
    chatWindow.hidden = true;
  });
  header.append(title, close);

  const body = document.createElement('div');
  body.className = `${HIJOB_PREFIX}-chat-body`;
  body.textContent = '点击下方「生成回复」，获取下一条回复建议';

  const footer = document.createElement('div');
  footer.className = `${HIJOB_PREFIX}-chat-footer`;
  const greeting = document.createElement('button');
  greeting.className = `${HIJOB_PREFIX}-copy-button`;
  greeting.textContent = '问候';
  greeting.addEventListener('click', () => {
    void handleGreeting(body, greeting);
  });
  const followUp = document.createElement('button');
  followUp.className = `${HIJOB_PREFIX}-copy-button`;
  followUp.textContent = '提醒';
  followUp.addEventListener('click', () => {
    void handleFollowUp(body, followUp);
  });
  const feedback = document.createElement('button');
  feedback.className = `${HIJOB_PREFIX}-copy-button`;
  feedback.textContent = '反馈';
  feedback.addEventListener('click', () => {
    void handleRejectionFeedback({ bodyEl: body, feedbackButton: feedback });
  });
  const generate = document.createElement('button');
  generate.className = `${HIJOB_PREFIX}-reply-button`;
  generate.textContent = '回复';
  generate.addEventListener('click', () => {
    void handleGenerateReply(body, generate);
  });
  const copy = document.createElement('button');
  copy.className = `${HIJOB_PREFIX}-copy-button`;
  copy.textContent = '复制';
  copy.addEventListener('click', () => {
    void copyReplyText(body, copy);
  });
  footer.append(greeting, followUp, feedback, generate, copy);

  chatWindow.append(header, body, footer);
  document.body.append(chatWindow);
  enableFabDrag(fab, chatWindow);
};

export { ensureReplyBox };
