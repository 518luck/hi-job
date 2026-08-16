// # 扩展运行时桥（隔离世界）：把主世界脚本的运行时消息请求转发给后台
//
// 主世界内容脚本拿不到 chrome API，经 postMessage 把消息交给本脚本转发，
// 后台应答原样回传；请求/应答用 requestId 配对。
import { browser } from 'wxt/browser';

// 桥请求/应答消息类型标识
const BRIDGE_REQUEST = 'hi-job:bridge-request';
const BRIDGE_RESPONSE = 'hi-job:bridge-response';

// 判断是否为主世界发来的桥请求
const isBridgeRequest = (
  data: unknown,
): data is {
  type: typeof BRIDGE_REQUEST;
  requestId: string;
  message: unknown;
} => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    record.type === BRIDGE_REQUEST &&
    typeof record.requestId === 'string' &&
    'message' in record
  );
};

// 响应一次桥请求：转发给后台并回传结果
const respondBridge = async (
  requestId: string,
  message: unknown,
): Promise<void> => {
  try {
    const response = await browser.runtime.sendMessage(message);
    window.postMessage(
      { type: BRIDGE_RESPONSE, requestId, ok: true, response },
      '*',
    );
  } catch (error) {
    window.postMessage(
      {
        type: BRIDGE_RESPONSE,
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
    if (isBridgeRequest(event.data)) {
      void respondBridge(event.data.requestId, event.data.message);
    }
  });
};

export { startRuntimeBridge };
