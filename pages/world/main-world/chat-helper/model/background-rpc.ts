// # 后台调用封装（主世界）：经 Window RPC 桥转发扩展消息给后台
import {
  createWindowRpcClient,
  WINDOW_RPC_NAMESPACE_BACKGROUND,
} from '@/pages/world/rpc';
import type { ProtocolMap } from '@/shared/infra/messaging';
import type { ChatMessageInput, HrInput } from '@/shared/zod';

// 聊天页到隔离世界的直通 RPC 客户端
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

// 业务调用封装：方法名、参数与返回值集中受 ProtocolMap 约束
// AI 生成已迁至隔离世界聊天 UI（直接 sendMessage），此处只留数据上报与名单读取
const extensionApi = {
  saveHr: (data: HrInput): Promise<void> => callBackground('saveHr', data),
  syncHrs: (data: HrInput[]): Promise<void> => callBackground('syncHrs', data),
  saveChatMessages: (data: ChatMessageInput[]): Promise<void> =>
    callBackground('saveChatMessages', data),
  getExcludedHrIds: (): Promise<string[]> =>
    callBackground('getExcludedHrIds', undefined),
};

export { extensionApi };
