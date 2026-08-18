// # Boss直聘 内容脚本（隔离世界）：监听用户点开的职位并自动记录
import {
  startJdDetailGreet,
  startJdRecorder,
  startJobCardBlocker,
  startJobCardChatted,
  startJobCardDecorator,
  startJobChangeWatcher,
  startRuntimeBridge,
} from '@/pages/world/isolated-world';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  main() {
    // 用户点开的每个职位自动入库
    startJdRecorder({ doc: document });
    // 列表卡片注入公司规模标签
    startJobCardDecorator({ doc: document });
    // 列表卡片按屏蔽公司名单盖「已屏蔽」遮罩
    startJobCardBlocker({ doc: document });
    // 列表卡片按 HR 档案给沟通过的公司标「已沟通」
    startJobCardChatted({ doc: document });
    // 职位选中变化时通知后台，侧边栏工作台刷新公司信息卡
    startJobChangeWatcher({ doc: document });
    // 主世界聊天页脚本的扩展 API 请求转发（主世界拿不到 chrome API）
    startRuntimeBridge();
    // 带 hash 标记打开的详情页自动点「立即沟通」与「继续沟通」
    startJdDetailGreet();
  },
});
