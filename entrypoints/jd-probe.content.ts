// # 职位页数据探测脚本（主世界，临时工具）：注入按钮 dump 职位页 Vue 数据
import { startJdProbe } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅职位页激活，注入探测按钮
    startJdProbe();
  },
});
