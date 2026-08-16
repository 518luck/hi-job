// # vue-job-data 桥协议：主世界与隔离世界共享的消息类型与数据结构
//
// 隔离世界请求主世界读取页面 Vue 原始数据（薪资/规模/行业），
// 协议常量与数据结构在此单一事实来源，两世界共用。
// 请求/应答用 requestId 配对，单次超时 300ms、最多 3 次重试。

// 当前职位数据请求/应答消息类型标识
const VUE_JOB_DATA_REQUEST = 'hi-job:vue-job-data-request';
const VUE_JOB_DATA_RESPONSE = 'hi-job:vue-job-data-response';

// 卡片列表请求/应答消息类型标识
const VUE_JOB_CARDS_REQUEST = 'hi-job:vue-job-cards-request';
const VUE_JOB_CARDS_RESPONSE = 'hi-job:vue-job-cards-response';

// 主世界读取的当前职位原始数据，缺项为空串
interface VueJobData {
  salaryDesc: string; // 原始薪资描述，如 10-15K
  companyScale: string; // 公司规模，如 100-499人
  companyIndustry: string; // 公司行业，如 互联网
}

// 单张列表卡片的规模信息
interface VueJobCard {
  scale: string; // 公司规模，如 1000-9999人
  industry: string; // 公司行业，如 互联网
}

// 主世界收到的请求消息结构（两种请求同构）
type BridgeRequest = { requestId: string };

// 判断是否为指定类型的请求/应答消息
const isMessageOf = (
  data: unknown,
  type: string,
): data is BridgeRequest & { requestId: string } =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === type &&
  'requestId' in data;

export type { VueJobCard, VueJobData };
export {
  isMessageOf,
  VUE_JOB_CARDS_REQUEST,
  VUE_JOB_CARDS_RESPONSE,
  VUE_JOB_DATA_REQUEST,
  VUE_JOB_DATA_RESPONSE,
};
