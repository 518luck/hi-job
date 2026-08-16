// # Vue 职位数据服务（主世界）：提供页面 Vue 原始职位数据

import {
  createWindowRpcServer,
  type VueJobCard,
  type VueJobData,
  type WindowMethodMap,
} from '@/pages/world/rpc';
import { readProperty, stringOf } from '@/shared/lib/page-property';

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

// 主世界 Vue 数据服务：注册统一 Window RPC 方法
let vueJobDataProviderStarted = false;

const startVueJobDataProvider = (): void => {
  if (vueJobDataProviderStarted) {
    return;
  }
  vueJobDataProviderStarted = true;
  createWindowRpcServer<
    Pick<WindowMethodMap, 'vue.getCurrentJob' | 'vue.getJobCards'>
  >({
    methods: {
      'vue.getCurrentJob': () => extractJobData(readVueState('currentJob')),
      'vue.getJobCards': () => extractJobCards(readVueState('jobList')),
    },
  });
};

export { startVueJobDataProvider };
