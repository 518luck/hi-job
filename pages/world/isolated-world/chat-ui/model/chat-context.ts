// # 聊天上下文客户端（隔离世界）：经 vue-chat 命名空间 Window RPC 读取主世界会话数据
import {
  createWindowRpcClient,
  WINDOW_RPC_NAMESPACE_VUE_CHAT,
  type WindowMethodMap,
} from '@/pages/world/rpc';
import type { ChatContext } from '@/shared/zod';

// 聊天上下文 RPC 客户端：主世界带重试读取 Vue/DOM，超时给足窗口
const chatContextRpc = createWindowRpcClient<
  Pick<WindowMethodMap, 'vue.getChatContext'>
>({ namespace: WINDOW_RPC_NAMESPACE_VUE_CHAT, timeoutMs: 10_000 });

// 读取当前会话上下文：主世界读不到会话（页面未就绪）时返回 null
const requestChatContext = (): Promise<ChatContext | null> =>
  chatContextRpc.call('vue.getChatContext', undefined);

export { requestChatContext };
