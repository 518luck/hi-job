// # 聊天上下文服务（主世界）：向隔离世界聊天 UI 提供当前会话数据
//
// 走 vue-chat 独立命名空间：职位数据服务（vue）在本页也会注册，同命名空间会竞争应答。

import {
  createWindowRpcServer,
  WINDOW_RPC_NAMESPACE_VUE_CHAT,
  type WindowMethodMap,
} from '@/pages/world/rpc';
import { stringOf } from '@/shared/lib/page-property';

import {
  hrOf,
  readCurrentBossWithRetry,
  readMessagesWithRetry,
  replyJdOf,
} from './vue-reader';

let chatContextServerStarted = false;

// 注册聊天上下文 RPC 服务：读当前会话与聊天记录，供聊天 UI 发起 AI 生成取材
const startChatContextServer = (): void => {
  if (chatContextServerStarted) {
    return;
  }
  chatContextServerStarted = true;
  createWindowRpcServer<Pick<WindowMethodMap, 'vue.getChatContext'>>({
    namespace: WINDOW_RPC_NAMESPACE_VUE_CHAT,
    methods: {
      'vue.getChatContext': async () => {
        const boss = await readCurrentBossWithRetry();
        if (boss === null) {
          return null;
        }
        return {
          jobId: stringOf(boss, 'encryptJobId'),
          jd: replyJdOf(boss),
          hr: hrOf(boss),
          messages: await readMessagesWithRetry(),
        };
      },
    },
  });
};

export { startChatContextServer };
