// # 职位列表页数据探测脚本（主世界，临时工具）：注入按钮 dump 列表页 Vue 数据
import { startJdProbe } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅职位列表页激活，注入探测按钮
    startJdProbe();
  },
});
