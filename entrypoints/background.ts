// # 后台脚本：侧边栏行为 + 消息中枢（内容脚本的记录请求落库）
import { jdStore } from '@/infra/storage';
import { recordJdMessageSchema } from '@/shared/zod';

export default defineBackground(() => {
  // 点击工具栏图标直接打开侧边栏面板（Chrome 专属 API，Firefox 自动跳过）
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });

  // > 内容脚本发来的选中 JD：跨环境无类型消息，经 zod 校验后写入本地数据库
  browser.runtime.onMessage.addListener((message) => {
    const parsed = recordJdMessageSchema.safeParse(message);
    if (parsed.success) {
      jdStore.saveSelectedJd({ jd: parsed.data.jd });
    }
  });
});
