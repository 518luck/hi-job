// # Window RPC 传输层：统一主世界与隔离世界的请求、响应、超时与错误
import { z } from 'zod';

// RPC 通道命名空间：vue 数据服务与后台桥各自独立，同窗多服务端靠 namespace 区分，避免误应答
const WINDOW_RPC_NAMESPACE_VUE = 'hi-job/window-rpc/vue';
const WINDOW_RPC_NAMESPACE_BACKGROUND = 'hi-job/window-rpc/background';

// 页面内单向通知：后台推送经隔离世界桥转发给主世界，无请求响应结构
const WINDOW_NOTIFY_NAMESPACE = 'hi-job/window-notify';

// 通知类型：HR 标记已变更，主世界收到后重拉标记
const WINDOW_NOTIFY_MARKS_CHANGED = 'marks-changed';

// Window RPC 信封协议版本
const WINDOW_RPC_VERSION = 1;

// Window RPC 信封类型
const windowRpcRequestSchema = z.object({
  namespace: z.string().min(1), // 协议命名空间
  version: z.literal(WINDOW_RPC_VERSION), // 协议版本
  kind: z.literal('request'), // 请求类型
  id: z.string().min(1), // 请求唯一 id
  method: z.string().min(1), // 远程方法名
  payload: z.unknown(), // 方法参数
});

const windowRpcResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    namespace: z.string().min(1), // 协议命名空间
    version: z.literal(WINDOW_RPC_VERSION), // 协议版本
    kind: z.literal('response'), // 响应类型
    id: z.string().min(1), // 对应请求 id
    ok: z.literal(true), // 成功标识
    result: z.unknown(), // 方法返回值
  }),
  z.object({
    namespace: z.string().min(1), // 协议命名空间
    version: z.literal(WINDOW_RPC_VERSION), // 协议版本
    kind: z.literal('response'), // 响应类型
    id: z.string().min(1), // 对应请求 id
    ok: z.literal(false), // 失败标识
    error: z.object({
      code: z.string(), // 稳定错误码
      message: z.string(), // 可展示错误信息
    }),
  }),
]);

type WindowRpcRequest = z.infer<typeof windowRpcRequestSchema>;
type WindowRpcResponse = z.infer<typeof windowRpcResponseSchema>;

// 客户端选项：namespace 必填，绑定唯一通道
type WindowRpcClientOptions = {
  namespace: string;
  timeoutMs?: number;
};

// 服务端选项：namespace 必填，只应答本通道请求
type WindowRpcServerOptions<
  TMethods extends Record<string, { input: unknown; output: unknown }>,
> = {
  namespace: string;
  methods: {
    [TMethod in keyof TMethods]: (
      input: TMethods[TMethod]['input'],
    ) => TMethods[TMethod]['output'] | Promise<TMethods[TMethod]['output']>;
  };
};

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

// 创建主世界/隔离世界通用 RPC 客户端：一个监听器管理全部并发请求
const createWindowRpcClient = <
  TMethods extends Record<string, { input: unknown; output: unknown }>,
>({
  namespace,
  timeoutMs = 30_000,
}: WindowRpcClientOptions) => {
  const pending = new Map<string, PendingRequest>();

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    const parsed = windowRpcResponseSchema.safeParse(event.data);
    if (!parsed.success) {
      return;
    }
    if (parsed.data.namespace !== namespace) {
      return;
    }
    const request = pending.get(parsed.data.id);
    if (request === undefined) {
      return;
    }
    pending.delete(parsed.data.id);
    clearTimeout(request.timer);
    if (parsed.data.ok) {
      request.resolve(parsed.data.result);
      return;
    }
    request.reject(
      new Error(`${parsed.data.error.code}: ${parsed.data.error.message}`),
    );
  };

  window.addEventListener('message', onMessage);

  const call = <TMethod extends keyof TMethods>(
    method: TMethod,
    payload: TMethods[TMethod]['input'],
  ): Promise<TMethods[TMethod]['output']> =>
    new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`TIMEOUT: Window RPC ${String(method)} 超时`));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      window.postMessage(
        {
          namespace,
          version: WINDOW_RPC_VERSION,
          kind: 'request',
          id,
          method,
          payload,
        },
        location.origin,
      );
    });

  const close = (): void => {
    window.removeEventListener('message', onMessage);
    for (const [id, request] of pending) {
      clearTimeout(request.timer);
      request.reject(new Error('CLOSED: Window RPC client closed'));
      pending.delete(id);
    }
  };

  return { call, close };
};

// 创建 Window RPC 服务端：只应答本通道请求，按方法白名单处理并统一返回错误
const createWindowRpcServer = <
  TMethods extends Record<string, { input: unknown; output: unknown }>,
>({
  namespace,
  methods,
}: WindowRpcServerOptions<TMethods>) => {
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    const parsed = windowRpcRequestSchema.safeParse(event.data);
    if (!parsed.success) {
      return;
    }
    if (parsed.data.namespace !== namespace) {
      return;
    }
    if (!Object.hasOwn(methods, parsed.data.method)) {
      window.postMessage(
        {
          namespace,
          version: WINDOW_RPC_VERSION,
          kind: 'response',
          id: parsed.data.id,
          ok: false,
          error: { code: 'METHOD_NOT_FOUND', message: parsed.data.method },
        },
        location.origin,
      );
      return;
    }
    const handler = methods[parsed.data.method as keyof TMethods];
    Promise.resolve()
      .then(() => handler(parsed.data.payload as never))
      .then(
        (result) => {
          window.postMessage(
            {
              namespace,
              version: WINDOW_RPC_VERSION,
              kind: 'response',
              id: parsed.data.id,
              ok: true,
              result,
            },
            location.origin,
          );
        },
        (error: unknown) => {
          window.postMessage(
            {
              namespace,
              version: WINDOW_RPC_VERSION,
              kind: 'response',
              id: parsed.data.id,
              ok: false,
              error: {
                code: 'HANDLER_ERROR',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Window RPC handler failed',
              },
            },
            location.origin,
          );
        },
      );
  };

  window.addEventListener('message', onMessage);
  return {
    close: (): void => window.removeEventListener('message', onMessage),
  };
};

export type { WindowRpcRequest, WindowRpcResponse };
export {
  createWindowRpcClient,
  createWindowRpcServer,
  WINDOW_NOTIFY_MARKS_CHANGED,
  WINDOW_NOTIFY_NAMESPACE,
  WINDOW_RPC_NAMESPACE_BACKGROUND,
  WINDOW_RPC_NAMESPACE_VUE,
  WINDOW_RPC_VERSION,
  windowRpcRequestSchema,
  windowRpcResponseSchema,
};
