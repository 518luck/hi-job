// # Vue 职位数据桥：隔离世界脚本经 window.postMessage 向主世界请求未混淆的原始职位数据
//
// 数据源为列表页组件实例（.page-jobs-main.__vue__）：currentJob 是当前选中职位，
// jobList 是整页卡片列表；页面 DOM 文本可能被字体混淆，故一律优先取这里。
// ! 防腐层接缝：postMessage 协议（VueJobData 等）对下游稳定；本文件内对页面数据的
// 读取是可替换适配器——站点若迁移 Vue3/React 导致 __vue__ 失效，改为在主世界
// 拦截 fetch/XHR 解析 wapi 响应（/wapi/zpgeek/job/*.json）实现同协议即可，下游不动。

// 职位数据桥请求/应答消息类型标识
const VUE_JOB_DATA_REQUEST = 'hi-job:vue-job-data-request';
const VUE_JOB_DATA_RESPONSE = 'hi-job:vue-job-data-response';

// 卡片列表请求/应答消息类型标识
const VUE_JOB_CARDS_REQUEST = 'hi-job:vue-job-cards-request';
const VUE_JOB_CARDS_RESPONSE = 'hi-job:vue-job-cards-response';

// 单次请求超时与重试次数：主世界脚本或页面 Vue 实例可能晚于请求就绪
const REQUEST_TIMEOUT_MS = 300;
const REQUEST_RETRIES = 3;

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

// 安全读取页面私有对象属性，避免 Vue 内部代理异常阻断读取
const readProperty = (source: unknown, key: string): unknown => {
  if (source === null || typeof source !== 'object') {
    return undefined;
  }

  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
};

// 读取字符串属性，非字符串或读取失败回退空串
const stringOf = (source: unknown, key: string): string => {
  const value = readProperty(source, key);
  return typeof value === 'string' ? value.trim() : '';
};

// 从 currentJob 原始对象提取所需字段（主世界侧，字段名与页面数据源一致）
const extractJobData = (currentJob: unknown): VueJobData => ({
  salaryDesc: stringOf(currentJob, 'salaryDesc'),
  companyScale: stringOf(currentJob, 'brandScaleName'),
  companyIndustry: stringOf(currentJob, 'brandIndustry'),
});

// 还原应答中的结构化数据（隔离世界侧，字段名与本模块一致）
const parseJobData = (payload: unknown): VueJobData => ({
  salaryDesc: stringOf(payload, 'salaryDesc'),
  companyScale: stringOf(payload, 'companyScale'),
  companyIndustry: stringOf(payload, 'companyIndustry'),
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

// 隔离世界侧：向主世界请求职位原始数据；薪资为空则重试，最终由调用方回退 DOM 文本
const requestVueJobData = async (): Promise<VueJobData> => {
  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    const jobData = await requestVueJobDataOnce(REQUEST_TIMEOUT_MS);
    if (jobData.salaryDesc !== '') {
      return jobData;
    }
  }
  return { salaryDesc: '', companyScale: '', companyIndustry: '' };
};

// 隔离世界侧：请求整页卡片规模信息；单次超时回空表，由装饰器的下次页面变化重试
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

export type { VueJobCard, VueJobData };
export { requestJobCards, requestVueJobData, startVueJobDataProvider };
