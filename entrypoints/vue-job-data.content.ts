// # Boss直聘 内容脚本（主世界）：向隔离世界脚本提供页面 Vue 原始数据
import { startVueJobDataProvider } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 响应隔离世界脚本的职位数据请求（薪资 / 公司规模 / 行业）
    startVueJobDataProvider();
  },
});
