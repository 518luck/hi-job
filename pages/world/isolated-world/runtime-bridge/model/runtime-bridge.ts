// # 扩展运行时桥（隔离世界）：把主世界的后台调用原样转发给后台
//
// 桥是哑管道：不逐方法登记、不含业务逻辑，任何 ProtocolMap 消息原样转发；
// 类型安全由两端保证——主世界调用处的泛型与后台 handler 的 ProtocolMap。

import {
  type BackgroundCallInput,
  createWindowRpcServer,
} from '@/pages/world/rpc';
import { sendMessage } from '@/shared/messaging';

let runtimeBridgeStarted = false;

// 启动主世界到后台的直通 RPC 服务
const startRuntimeBridge = (): void => {
  if (runtimeBridgeStarted) {
    return;
  }
  runtimeBridgeStarted = true;
  createWindowRpcServer<{
    'background.call': { input: BackgroundCallInput; output: unknown };
  }>({
    methods: {
      'background.call': ({ method, data }) =>
        // > 动态消息名的转发接缝：类型由两端约束，此处断言放行
        sendMessage(method, data as never),
    },
  });
};

export { startRuntimeBridge };
