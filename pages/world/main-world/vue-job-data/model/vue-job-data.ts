// # Vue 职位数据提供（主世界）：响应隔离世界的原始职位数据请求
//
// 数据源为列表页组件实例（.page-jobs-main.__vue__）：currentJob 是当前选中职位，
// jobList 是整页卡片列表；页面 DOM 文本可能被字体混淆，故一律优先取这里。
// ! 防腐层接缝：postMessage 协议（vue-job-data）对下游稳定；本文件内对页面数据的
//   读取是可替换适配器——站点若迁移 Vue3/React 导致 __vue__ 失效，改为在主世界
//   拦截 fetch/XHR 解析 wapi 响应（/wapi/zpgeek/job/*.json）实现同协议即可，下游不动。

import { readProperty, stringOf } from '@/shared/lib/page-property';
import type { VueJobCard, VueJobData } from '@/shared/messaging';
import {
  isMessageOf,
  VUE_JOB_CARDS_REQUEST,
  VUE_JOB_CARDS_RESPONSE,
  VUE_JOB_DATA_REQUEST,
  VUE_JOB_DATA_RESPONSE,
} from '@/shared/messaging';

// 从 currentJob 原始对象提取所需字段（主世界侧，字段名与页面数据源一致）
const extractJobData = (currentJob: unknown): VueJobData => ({
  salaryDesc: stringOf(currentJob, 'salaryDesc'),
  companyScale: stringOf(currentJob, 'brandScaleName'),
  companyIndustry: stringOf(currentJob, 'brandIndustry'),
});

// 从 jobList 原始数组提取各卡片规模信息，键为 encryptJobId（主世界侧）
const extractJobCards = (jobList: unknown): Record<string, VueJobCard> => {
  const cards: Record<string, VueJobCard> = {};
  if (Array.isArray(jobList)) {
    for (const item of jobList) {
      const jobId = stringOf(item, 'encryptJobId');
      if (jobId === '') {
        continue;
      }
      cards[jobId] = {
        scale: stringOf(item, 'brandScaleName'),
        industry: stringOf(item, 'brandIndustry'),
      };
    }
  }
  return cards;
};

// 从页面 Vue 实例读取指定属性（currentJob / jobList）
const readVueState = (key: string): unknown =>
  readProperty(
    readProperty(
      document.querySelector<HTMLElement>('.page-jobs-main'),
      '__vue__',
    ),
    key,
  );

// 主世界侧：响应隔离世界的职位数据与卡片列表请求；必须运行在 world=MAIN 的内容脚本里
const startVueJobDataProvider = (): void => {
  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return;
    }
    if (isMessageOf(event.data, VUE_JOB_DATA_REQUEST)) {
      window.postMessage(
        {
          type: VUE_JOB_DATA_RESPONSE,
          requestId: event.data.requestId,
          jobData: extractJobData(readVueState('currentJob')),
        },
        '*',
      );
      return;
    }
    if (isMessageOf(event.data, VUE_JOB_CARDS_REQUEST)) {
      window.postMessage(
        {
          type: VUE_JOB_CARDS_RESPONSE,
          requestId: event.data.requestId,
          cards: extractJobCards(readVueState('jobList')),
        },
        '*',
      );
    }
  });
};

export { startVueJobDataProvider };
