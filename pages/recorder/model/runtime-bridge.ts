// # 扩展运行时桥（隔离世界）：把主世界脚本的协议请求转发给后台
//
// 主世界内容脚本拿不到 chrome API，经 postMessage 把「协议名 + 数据」交给本脚本，
// 用类型安全的 sendMessage 转发后台，应答原样回传；请求/应答用 requestId 配对。
import type { ProtocolMap } from '@/shared/messaging';
import { bridgeRequestSchema, sendMessage } from '@/shared/messaging';

// 响应一次桥请求：按协议名转发后台并回传结果
const respondBridge = async (
  requestId: string,
  protocol: string,
  data: unknown,
): Promise<void> => {
  try {
    // > 协议名来自主世界字符串，运行时桥的接缝处断言为协议键
    const response = await sendMessage(
      protocol as keyof ProtocolMap,
      data as never,
    );
    window.postMessage(
      { type: 'hi-job:bridge-response', requestId, ok: true, response },
      '*',
    );
  } catch (error) {
    window.postMessage(
      {
        type: 'hi-job:bridge-response',
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : '扩展调用失败',
      },
      '*',
    );
  }
};

// 启动桥：监听主世界消息并转发
const startRuntimeBridge = (): void => {
  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return;
    }
    const parsed = bridgeRequestSchema.safeParse(event.data);
    if (parsed.success) {
      void respondBridge(
        parsed.data.requestId,
        parsed.data.protocol,
        parsed.data.data,
      );
    }
  });
};

export { startRuntimeBridge };
