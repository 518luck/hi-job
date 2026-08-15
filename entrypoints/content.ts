// # Boss直聘 内容脚本：注入职位页，向侧边栏提供当前选中的 JD
import { GET_SELECTED_JD, parseSelectedJd } from '@/pages/favorites';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  main() {
    // > 同步解析后立即回包；若改为异步，监听器需 return true 才能保持消息通道
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === GET_SELECTED_JD) {
        sendResponse(parseSelectedJd(document));
      }
    });
  },
});
