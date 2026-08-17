// # 职位详情页数据探测脚本（主世界，临时工具）：注入按钮 dump 详情页 Vue 数据
import { startJdDetailProbe } from '@/pages/world/main-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅职位详情页激活，注入探测按钮
    startJdDetailProbe();
  },
});
