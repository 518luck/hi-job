// # 聊天页辅助（主世界）：会话总数、HR 失败标记、会话档案上报、AI 生成回复的启动编排
//
// 主世界才能安全读取页面 Vue 实例（__vue__）数据；主世界拿不到 chrome API，
// 扩展协议调用经 postMessage 桥（shared/infra/messaging）交给隔离世界转发后台。

import { syncChatSession } from './chat-session-report';
import { loadMarks, syncAllItems, syncFriendCount } from './friend-mark';
import { ensureReplyBox } from './reply-box';
import { ensureStyle } from './style';

// 启动聊天页辅助：仅聊天页激活，加载标记、注入组件，页面变化时防抖同步
const startChatHelper = (): void => {
  if (
    !location.pathname.includes('/chat') &&
    document.querySelector('.chat-container') === null
  ) {
    return;
  }
  ensureStyle();
  ensureReplyBox();
  syncFriendCount();
  syncChatSession();
  void loadMarks();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      syncFriendCount();
      syncAllItems();
      ensureReplyBox();
      syncChatSession();
    }, 500);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export { startChatHelper };
