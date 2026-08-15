// # Boss直聘 内容脚本（主世界）：向隔离世界脚本提供页面 Vue 原始数据
import { startVueSalaryProvider } from '@/pages/recorder';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 响应隔离世界脚本的薪资请求
    startVueSalaryProvider();
  },
});
