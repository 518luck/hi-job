import { RECORD_JD } from '@/shared/zod/jd';

import { parseSelectedJd } from './parse-jd';

// 防抖等待时长：等详情面板渲染稳定后再解析
const DEBOUNCE_MS = 500;

// 解析当前详情并把 JD 发给后台落库；同一职位在会话内重复触发时跳过
const record = async ({
  doc,
  lastJobId,
}: {
  doc: Document;
  lastJobId: string;
}): Promise<string> => {
  const jd = await parseSelectedJd(doc);
  if (jd === null || jd.jobId === '' || jd.jobId === lastJobId) {
    return lastJobId;
  }
  // 后台唤醒失败等极端情况下静默放弃本条，等下次页面变化再记录
  browser.runtime.sendMessage({ type: RECORD_JD, jd }).catch(() => {});
  return jd.jobId;
};

// 监听页面变化，把用户点开的每个职位自动发送给后台记录
const startJdRecorder = ({ doc }: { doc: Document }) => {
  let lastJobId = '';
  // > 薪资需等待主世界应答，解析已异步化；串行执行避免并发时绕过 lastJobId 去重
  let pending: Promise<void> = Promise.resolve();

  const scheduleRecord = () => {
    pending = pending
      .then(async () => {
        lastJobId = await record({ doc, lastJobId });
      })
      .catch(() => {});
  };

  // 页面加载时详情可能已展开，先记录一次
  scheduleRecord();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(scheduleRecord, DEBOUNCE_MS);
  });
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

export { startJdRecorder };
