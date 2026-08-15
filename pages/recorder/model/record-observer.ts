import { RECORD_JD } from '@/shared/zod/jd';

import { parseSelectedJd } from './parse-jd';

// 防抖等待时长：等详情面板渲染稳定后再解析
const DEBOUNCE_MS = 500;

// 解析当前详情并把 JD 发给后台落库；同一职位在会话内重复触发时跳过
const record = ({
  doc,
  lastJobId,
}: {
  doc: Document;
  lastJobId: string;
}): string => {
  const jd = parseSelectedJd(doc);
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

  // 页面加载时详情可能已展开，先记录一次
  lastJobId = record({ doc, lastJobId });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      lastJobId = record({ doc, lastJobId });
    }, DEBOUNCE_MS);
  });
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

export { startJdRecorder };
