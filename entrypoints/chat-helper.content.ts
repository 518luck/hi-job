// # 聊天页辅助脚本（主世界）：会话总数、HR 失败标记、AI 生成回复
import { startChatHelper } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅聊天页激活，注入总人数、标记与 AI 回复入口
    startChatHelper();
  },
});
