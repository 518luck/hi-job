// # 世界共享 RPC 层公有 API：两世界之间的传输与方法类型
// 本目录是世界共享目录（非业务 slice），允许被 isolated-world 与 main-world 导入
export type { BackgroundCallInput, WindowMethodMap } from './window-methods';
export type { WindowRpcRequest, WindowRpcResponse } from './window-rpc';
export {
  createWindowRpcClient,
  createWindowRpcServer,
  WINDOW_RPC_NAMESPACE_BACKGROUND,
  WINDOW_RPC_NAMESPACE_VUE,
  WINDOW_RPC_VERSION,
  windowRpcRequestSchema,
  windowRpcResponseSchema,
} from './window-rpc';
