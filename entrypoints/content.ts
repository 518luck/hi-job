// # Boss直聘 内容脚本：自动记录用户点开的职位
import { startJdRecorder } from '@/pages/favorites';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  main() {
    // 用户点开的每个职位自动入库
    startJdRecorder({ doc: document });
  },
});
