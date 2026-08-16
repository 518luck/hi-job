// # 后台调用封装（主世界，职位页探测）：经 Window RPC 桥转发扩展消息给后台
import {
  createWindowRpcClient,
  WINDOW_RPC_NAMESPACE_BACKGROUND,
} from '@/pages/world/rpc';
import type { ProtocolMap } from '@/shared/infra/messaging';
import type { DebugSettings } from '@/shared/zod';

// 职位页探测到隔离世界的直通 RPC 客户端
const backgroundRpc = createWindowRpcClient<{
  'background.call': {
    input: { method: keyof ProtocolMap; data: unknown };
    output: unknown;
  };
}>({ namespace: WINDOW_RPC_NAMESPACE_BACKGROUND });

// 直通调用后台：方法名与参数类型由 ProtocolMap 派生，编译期即校验
const callBackground = <K extends keyof ProtocolMap>(
  method: K,
  data: Parameters<ProtocolMap[K]>[0],
): Promise<ReturnType<ProtocolMap[K]>> =>
  backgroundRpc
    .call('background.call', { method, data })
    .then((result) => result as ReturnType<ProtocolMap[K]>);

// 职位页探测的业务调用封装
const extensionApi = {
  getDebugSettings: (): Promise<DebugSettings> =>
    callBackground('getDebugSettings', undefined),
};

export { extensionApi };
