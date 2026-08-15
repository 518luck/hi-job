// # Boss直聘 内容脚本（隔离世界）：监听用户点开的职位并自动记录
import { startJdRecorder } from '@/pages/recorder';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  main() {
    // 用户点开的每个职位自动入库
    startJdRecorder({ doc: document });
  },
});
