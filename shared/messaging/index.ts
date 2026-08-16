// # 跨环境消息协议公有 API：ProtocolMap 收发、桥信封与 vue-job-data 桥协议

export type { BridgeRequest, BridgeResponse, ProtocolMap } from './protocol';
export {
  BRIDGE_REQUEST,
  BRIDGE_RESPONSE,
  bridgeRequestSchema,
  bridgeResponseSchema,
  onMessage,
  sendMessage,
} from './protocol';
export type { VueJobCard, VueJobData } from './vue-job-data';
export {
  isMessageOf,
  VUE_JOB_CARDS_REQUEST,
  VUE_JOB_CARDS_RESPONSE,
  VUE_JOB_DATA_REQUEST,
  VUE_JOB_DATA_RESPONSE,
} from './vue-job-data';
