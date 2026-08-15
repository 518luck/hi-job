// # Vue 职位数据桥：隔离世界脚本经 window.postMessage 向主世界请求未混淆的原始职位数据
//
// 数据源为列表页组件实例上的 currentJob（.page-jobs-main.__vue__），
// 含原始薪资与公司规模/行业；页面 DOM 文本可能被字体混淆，故一律优先取这里。

// 职位数据桥请求消息类型标识
const VUE_JOB_DATA_REQUEST = 'hi-job:vue-job-data-request';

// 职位数据桥应答消息类型标识
const VUE_JOB_DATA_RESPONSE = 'hi-job:vue-job-data-response';

// 单次请求超时与重试次数：主世界脚本或页面 Vue 实例可能晚于请求就绪
const REQUEST_TIMEOUT_MS = 300;
const REQUEST_RETRIES = 3;

// 主世界读取的当前职位原始数据，缺项为空串
interface VueJobData {
  salaryDesc: string; // 原始薪资描述，如 10-15K
  companyScale: string; // 公司规模，如 100-499人
  companyIndustry: string; // 公司行业，如 互联网
}

// 主世界收到的请求消息结构
type JobDataRequest = { requestId: string };

// 隔离世界收到的应答消息结构
type JobDataResponse = { requestId: string; jobData: unknown };

// 判断是否为本桥发出的请求消息
const isJobDataRequest = (data: unknown): data is JobDataRequest =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === VUE_JOB_DATA_REQUEST &&
  'requestId' in data;

// 判断是否为本桥发出的应答消息
const isJobDataResponse = (data: unknown): data is JobDataResponse =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === VUE_JOB_DATA_RESPONSE &&
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

// 从 currentJob 原始对象提取所需字段（主世界侧，字段名与页面数据源一致）
const extractJobData = (currentJob: unknown): VueJobData => {
  const pick = (key: string): string => {
    const value = readProperty(currentJob, key);
    return typeof value === 'string' ? value.trim() : '';
  };
  return {
    salaryDesc: pick('salaryDesc'),
    companyScale: pick('brandScaleName'),
    companyIndustry: pick('brandIndustry'),
  };
};

// 还原应答中的结构化数据（隔离世界侧，字段名与本模块一致），缺失回退空串
const parseJobData = (payload: unknown): VueJobData => {
  const pick = (key: keyof VueJobData): string => {
    const value = readProperty(payload, key);
    return typeof value === 'string' ? value.trim() : '';
  };
  return {
    salaryDesc: pick('salaryDesc'),
    companyScale: pick('companyScale'),
    companyIndustry: pick('companyIndustry'),
  };
};

// 从页面 Vue 实例读取当前职位的原始数据（未经过字体混淆）
const readVueJobData = (): VueJobData =>
  extractJobData(
    readProperty(
      readProperty(
        document.querySelector<HTMLElement>('.page-jobs-main'),
        '__vue__',
      ),
      'currentJob',
    ),
  );

// 主世界侧：响应隔离世界的职位数据请求；必须运行在 world=MAIN 的内容脚本里
const startVueJobDataProvider = (): void => {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !isJobDataRequest(event.data)) {
      return;
    }
    window.postMessage(
      {
        type: VUE_JOB_DATA_RESPONSE,
        requestId: event.data.requestId,
        jobData: readVueJobData(),
      },
      '*',
    );
  });
};

// 发出一次请求并等待应答，超时按空数据对象处理
const requestVueJobDataOnce = (timeoutMs: number): Promise<VueJobData> =>
  new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || !isJobDataResponse(event.data)) {
        return;
      }
      if (event.data.requestId !== requestId) {
        return;
      }
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(parseJobData(event.data.jobData));
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

export type { VueJobData };
export { requestVueJobData, startVueJobDataProvider };
