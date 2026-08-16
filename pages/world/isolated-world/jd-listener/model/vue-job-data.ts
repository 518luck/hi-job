// # Vue 职位数据请求（隔离世界）：向主世界请求未混淆的原始职位数据
//
// 数据源为列表页组件实例（.page-jobs-main.__vue__）；页面 DOM 文本可能被字体混淆，
// 故薪资/规模/行业一律优先取这里的原始数据。协议见 shared/messaging/vue-job-data。

import { readProperty, stringOf } from '@/shared/lib/page-property';
import type { VueJobCard, VueJobData } from '@/shared/messaging';
import {
  isMessageOf,
  VUE_JOB_CARDS_REQUEST,
  VUE_JOB_CARDS_RESPONSE,
  VUE_JOB_DATA_REQUEST,
  VUE_JOB_DATA_RESPONSE,
} from '@/shared/messaging';

// 单次请求超时与重试次数：主世界脚本或页面 Vue 实例可能晚于请求就绪
const REQUEST_TIMEOUT_MS = 300;
const REQUEST_RETRIES = 3;

// 还原应答中的结构化数据（隔离世界侧，字段名与本模块一致）
const parseJobData = (payload: unknown): VueJobData => ({
  salaryDesc: stringOf(payload, 'salaryDesc'),
  companyScale: stringOf(payload, 'companyScale'),
  companyIndustry: stringOf(payload, 'companyIndustry'),
});

// 还原应答中的卡片信息（隔离世界侧）
const parseJobCards = (payload: unknown): Record<string, VueJobCard> => {
  const cards: Record<string, VueJobCard> = {};
  if (typeof payload !== 'object' || payload === null) {
    return cards;
  }
  for (const [jobId, value] of Object.entries(payload)) {
    cards[jobId] = {
      scale: stringOf(value, 'scale'),
      industry: stringOf(value, 'industry'),
    };
  }
  return cards;
};

// 发出一次职位数据请求并等待应答，超时按空数据对象处理
const requestVueJobDataOnce = (timeoutMs: number): Promise<VueJobData> =>
  new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== window ||
        !isMessageOf(event.data, VUE_JOB_DATA_RESPONSE)
      ) {
        return;
      }
      if (event.data.requestId !== requestId) {
        return;
      }
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(parseJobData(readProperty(event.data, 'jobData')));
    };

    timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve({ salaryDesc: '', companyScale: '', companyIndustry: '' });
    }, timeoutMs);

    window.addEventListener('message', onMessage);
    window.postMessage({ type: VUE_JOB_DATA_REQUEST, requestId }, '*');
  });

// 向主世界请求职位原始数据；薪资为空则重试，最终由调用方回退 DOM 文本
const requestVueJobData = async (): Promise<VueJobData> => {
  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    const jobData = await requestVueJobDataOnce(REQUEST_TIMEOUT_MS);
    if (jobData.salaryDesc !== '') {
      return jobData;
    }
  }
  return { salaryDesc: '', companyScale: '', companyIndustry: '' };
};

// 请求整页卡片规模信息；单次超时回空表，由装饰器的下次页面变化重试
const requestJobCards = (): Promise<Record<string, VueJobCard>> =>
  new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== window ||
        !isMessageOf(event.data, VUE_JOB_CARDS_RESPONSE)
      ) {
        return;
      }
      if (event.data.requestId !== requestId) {
        return;
      }
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(parseJobCards(readProperty(event.data, 'cards')));
    };

    timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve({});
    }, REQUEST_TIMEOUT_MS);

    window.addEventListener('message', onMessage);
    window.postMessage({ type: VUE_JOB_CARDS_REQUEST, requestId }, '*');
  });

export { requestJobCards, requestVueJobData };
