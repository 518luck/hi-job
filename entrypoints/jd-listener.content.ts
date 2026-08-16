// # Boss直聘 内容脚本（隔离世界）：监听用户点开的职位并自动记录
import {
  startJdRecorder,
  startJobCardDecorator,
  startRuntimeBridge,
} from '@/pages/recorder';

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  main() {
    // 用户点开的每个职位自动入库
    startJdRecorder({ doc: document });
    // 列表卡片注入公司规模标签
    startJobCardDecorator({ doc: document });
    // 主世界聊天页脚本的扩展 API 请求转发（主世界拿不到 chrome API）
    startRuntimeBridge();
  },
});
