// # 跨环境消息协议公有 API：ProtocolMap 收发与桥信封

export type { BridgeRequest, BridgeResponse, ProtocolMap } from './protocol';
export {
  BRIDGE_REQUEST,
  BRIDGE_RESPONSE,
  bridgeRequestSchema,
  bridgeResponseSchema,
  onMessage,
  sendMessage,
} from './protocol';
