// # Vue 职位数据服务（主世界）：提供页面 Vue 原始职位数据

import {
  createWindowRpcServer,
  WINDOW_RPC_NAMESPACE_VUE,
  type WindowMethodMap,
} from '@/pages/world/rpc';
import { debugLog } from '@/shared/lib/debug-log';
import { readProperty, stringOf } from '@/shared/lib/page-property';
import type { VueJobCard, VueJobData } from '@/shared/zod';

// 详情面板 props data：公司规模（brandComInfo）与 HR 活跃状态（bossInfo）的来源
const readDetailPanelData = (): unknown =>
  readProperty(
    readProperty(
      readProperty(
        document.querySelector<HTMLElement>('.job-detail-box'),
        '__vue__',
      ),
      '$props',
    ),
    'data',
  );

// 从 currentJob 原始对象提取所需字段（主世界侧，字段名与页面数据源一致）
const extractJobData = (currentJob: unknown): VueJobData => {
  const detailData = readDetailPanelData();
  const brandComInfo = readProperty(detailData, 'brandComInfo');
  const bossInfo = readProperty(detailData, 'bossInfo');
  // 页面 bossOnline 目前为 true/false 字符串，兼容布尔与字符串两种取值；读不到时缺省
  const bossOnlineRaw = readProperty(currentJob, 'bossOnline');
  let bossOnline: boolean | undefined;
  if (bossOnlineRaw === true || bossOnlineRaw === 'true') {
    bossOnline = true;
  } else if (bossOnlineRaw === false || bossOnlineRaw === 'false') {
    bossOnline = false;
  }
  return {
    salaryDesc: stringOf(currentJob, 'salaryDesc'),
    companyScale:
      stringOf(brandComInfo, 'scaleName') ||
      stringOf(currentJob, 'brandScaleName'),
    companyIndustry:
      stringOf(currentJob, 'brandIndustry') ||
      stringOf(brandComInfo, 'industryName'),
    brandName:
      stringOf(currentJob, 'brandName') || stringOf(bossInfo, 'brandName'),
    bossOnline,
    bossActiveDesc: stringOf(bossInfo, 'activeTimeDesc'),
  };
};

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
        companyScale: stringOf(item, 'brandScaleName'),
        companyIndustry: stringOf(item, 'brandIndustry'),
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
    namespace: WINDOW_RPC_NAMESPACE_VUE,
    methods: {
      'vue.getCurrentJob': () => {
        const currentJob = readVueState('currentJob');
        const data = extractJobData(currentJob);
        debugLog(
          'vue.getCurrentJob',
          currentJob === undefined ? 'currentJob 不存在' : '已读取',
          data,
        );
        return data;
      },
      'vue.getJobCards': () => {
        const cards = extractJobCards(readVueState('jobList'));
        debugLog('vue.getJobCards', `共 ${Object.keys(cards).length} 张卡片`);
        return cards;
      },
    },
  });
  debugLog('vue-job-data 服务已注册');
};

export { startVueJobDataProvider };
