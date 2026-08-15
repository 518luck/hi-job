// # Vue 薪资桥：隔离世界脚本经 window.postMessage 向主世界脚本请求未混淆的原始薪资

// 薪资桥请求消息类型标识
const VUE_SALARY_REQUEST = 'hi-job:vue-salary-request';

// 薪资桥应答消息类型标识
const VUE_SALARY_RESPONSE = 'hi-job:vue-salary-response';

// 单次请求超时与重试次数：主世界脚本或页面 Vue 实例可能晚于请求就绪
const REQUEST_TIMEOUT_MS = 300;
const REQUEST_RETRIES = 3;

// 主世界收到的请求消息结构
type SalaryRequest = { requestId: string };

// 隔离世界收到的应答消息结构
type SalaryResponse = { requestId: string; salary: unknown };

// 判断是否为本桥发出的薪资请求消息
const isSalaryRequest = (data: unknown): data is SalaryRequest =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === VUE_SALARY_REQUEST &&
  'requestId' in data;

// 判断是否为本桥发出的薪资应答消息
const isSalaryResponse = (data: unknown): data is SalaryResponse =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === VUE_SALARY_RESPONSE &&
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

// 从页面 Vue 实例读取当前职位的原始薪资描述（未经过字体混淆）
const readVueSalary = (): string => {
  const jobsMain = document.querySelector<HTMLElement>('.page-jobs-main');
  const currentJob = readProperty(
    readProperty(jobsMain, '__vue__'),
    'currentJob',
  );
  const salary = readProperty(currentJob, 'salaryDesc');
  return typeof salary === 'string' ? salary.trim() : '';
};

// 主世界侧：响应隔离世界的薪资请求；必须运行在 world=MAIN 的内容脚本里
const startVueSalaryProvider = (): void => {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !isSalaryRequest(event.data)) {
      return;
    }
    window.postMessage(
      {
        type: VUE_SALARY_RESPONSE,
        requestId: event.data.requestId,
        salary: readVueSalary(),
      },
      '*',
    );
  });
};

// 发出一次薪资请求并等待对应应答，超时按空串处理
const requestVueSalaryOnce = (timeoutMs: number): Promise<string> =>
  new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || !isSalaryResponse(event.data)) {
        return;
      }
      if (event.data.requestId !== requestId) {
        return;
      }
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      const { salary } = event.data;
      resolve(typeof salary === 'string' ? salary.trim() : '');
    };

    timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve('');
    }, timeoutMs);

    window.addEventListener('message', onMessage);
    window.postMessage({ type: VUE_SALARY_REQUEST, requestId }, '*');
  });

// 隔离世界侧：向主世界请求 Vue 原始薪资，重试后仍为空则由调用方回退 DOM 文本
const requestVueSalary = async (): Promise<string> => {
  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    const salary = await requestVueSalaryOnce(REQUEST_TIMEOUT_MS);
    if (salary !== '') {
      return salary;
    }
  }
  return '';
};

export { requestVueSalary, startVueSalaryProvider };
