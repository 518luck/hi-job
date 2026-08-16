// # ai 域公有 API：厂商客户端与文本生成

export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_TASK,
  generateGreeting,
} from './greeting';
export { generateReply } from './reply';
export {
  chatWithVendor,
  createVendorClient,
  fetchVendorModels,
} from './vendor-client';
