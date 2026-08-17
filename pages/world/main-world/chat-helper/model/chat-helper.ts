// # 聊天页辅助（主世界）：会话总数、HR 排除名单、HR 档案与消息上报、AI 生成回复的启动编排
//
// 主世界才能安全读取页面 Vue 实例（__vue__）数据；主世界拿不到 chrome API，
// 扩展协议调用经 postMessage 桥（shared/infra/messaging）交给隔离世界转发后台。

import {
  WINDOW_NOTIFY_HRS_CHANGED,
  WINDOW_NOTIFY_NAMESPACE,
} from '@/pages/world/rpc';
import { readProperty } from '@/shared/lib/page-property';

import { loadExcludedHrs, syncAllItems, syncFriendCount } from './hr-marks';
import { syncAllHrs, syncChatMessages, syncHrReport } from './hr-report';
import { ensureReplyBox } from './reply-box';
import { ensureStyle } from './style';

// 判定隔离世界桥转发来的排除名单变更通知
const isHrsChangedNotify = (data: unknown): boolean =>
  readProperty(data, 'namespace') === WINDOW_NOTIFY_NAMESPACE &&
  readProperty(data, 'type') === WINDOW_NOTIFY_HRS_CHANGED;

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
  syncAllHrs();
  syncHrReport();
  void syncChatMessages();
  void loadExcludedHrs();

  // 后台推送的排除名单变更：工作台切换 Pass 后即时重拉，替代轮询
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    if (isHrsChangedNotify(event.data)) {
      void loadExcludedHrs();
    }
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      syncFriendCount();
      syncAllItems();
      ensureReplyBox();
      syncAllHrs();
      syncHrReport();
      void syncChatMessages();
    }, 500);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export { startChatHelper };
