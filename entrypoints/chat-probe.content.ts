// # 聊天页数据探测脚本（主世界，临时工具）：注入 test 按钮 dump Vue 数据
import { startChatProbe } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅聊天页激活，注入探测按钮
    startChatProbe();
  },
});
