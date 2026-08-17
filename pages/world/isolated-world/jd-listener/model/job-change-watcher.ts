// # 职位选中变化监听（隔离世界）：职位切换时通知后台，侧边栏工作台据此刷新公司信息卡
import { sendMessage } from '@/shared/infra/messaging';

import { currentJobIdOf } from './parse-jd';

// 防抖等待时长：页面变化后等选中稳定再判断
const DEBOUNCE_MS = 400;

// 启动职位上下文变化监听：页面类型或选中职位变化时通知后台，侧边栏工作台刷新上下文
const startJobChangeWatcher = ({ doc }: { doc: Document }): void => {
  let lastPage = '';
  let lastJobId = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // 页面类型与职位 id 任一变化即通知：覆盖职位列表页 ⇄ 其他页的切换
      const page = location.pathname.includes('/web/geek/jobs')
        ? 'jobs'
        : 'other';
      const jobId = page === 'jobs' ? currentJobIdOf(doc) : '';
      const pageChanged = page !== lastPage;
      const jobChanged = page === 'jobs' && jobId !== '' && jobId !== lastJobId;
      if (!pageChanged && !jobChanged) {
        return;
      }
      lastPage = page;
      if (jobId !== '') {
        lastJobId = jobId;
      }
      sendMessage('jobContextChanged', undefined).catch(() => {});
    }, DEBOUNCE_MS);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

export { startJobChangeWatcher };
