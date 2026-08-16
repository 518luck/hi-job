// # AI 回复框（主世界）：注入生成入口与结果卡，调后台生成下一条回复
import { stringOf } from '@/shared/lib/page-property';

import { extensionApi } from './background-rpc';
import { HIJOB_PREFIX } from './style';
import { readCurrentBoss, readMessagesFromDom, replyJdOf } from './vue-reader';

// 生成下一条回复：收集当前会话信息与聊天记录，经后台生成后展示
const handleGenerateReply = async (box: HTMLElement): Promise<void> => {
  const boss = readCurrentBoss();
  const textEl = box.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-reply-text`);
  if (boss === null) {
    if (textEl !== null) {
      textEl.textContent = '未找到当前会话信息';
    }
    return;
  }
  if (textEl === null) {
    return;
  }
  const messages = readMessagesFromDom();
  if (messages.length === 0) {
    textEl.textContent = '暂无聊天记录';
    return;
  }
  textEl.textContent = '生成中…';
  try {
    const response = await extensionApi.generateReply({
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      messages,
    });
    textEl.textContent = response;
  } catch (error) {
    textEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  }
};

// 注入 AI 回复入口：聊天窗口消息区下方常驻按钮与结果卡
const ensureReplyBox = (): void => {
  const conversation = document.querySelector('.chat-conversation');
  if (conversation === null) {
    return;
  }
  let box = conversation.querySelector<HTMLElement>(
    `.${HIJOB_PREFIX}-reply-box`,
  );
  if (box !== null) {
    return;
  }
  box = document.createElement('div');
  box.className = `${HIJOB_PREFIX}-reply-box`;
  const button = document.createElement('button');
  button.textContent = 'AI 生成回复';
  button.style.cssText =
    'padding:4px 12px;border:1px solid #00c26d;border-radius:4px;background:#fff;color:#00c26d;font-size:12px;cursor:pointer;';
  button.addEventListener('click', () => {
    void handleGenerateReply(box as HTMLElement);
  });
  const text = document.createElement('div');
  text.className = `${HIJOB_PREFIX}-reply-text`;
  box.append(button, text);
  // 插到消息区之后、输入区之前
  const messageContent = conversation.querySelector('.message-content');
  if (messageContent !== null && messageContent.nextElementSibling !== null) {
    conversation.insertBefore(box, messageContent.nextElementSibling);
  } else {
    conversation.append(box);
  }
};

export { ensureReplyBox };
