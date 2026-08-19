// # 聊天 UI 内容脚本（隔离世界）：Shadow Root 挂载 React 聊天助手
// 直接从 chat-ui 领域导入：避免经聚合出口把 React/CSS 拉进其他领域入口的打包图
import { startChatUi } from '@/pages/world/isolated-world/chat-ui';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  // 样式不注入宿主页面，随 Shadow Root UI 进入隔离层
  cssInjectionMode: 'ui',
  async main(ctx) {
    await startChatUi(ctx);
  },
});
