import { useCallback, useEffect, useRef, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { readProperty } from '@/shared/lib/page-property';
import type { PageJobContext } from '@/shared/zod';

// 工作台页面职位上下文：挂载时读取，页面职位切换通知到达时自动刷新
const usePageJobContext = (): { context?: PageJobContext } => {
  const [context, setContext] = useState<PageJobContext>();
  // 请求序号：并发刷新时丢弃过期响应，避免旧数据覆盖新数据
  const requestSeq = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    const next = await sendMessage('getPageJobContext', undefined).catch(
      () => undefined,
    );
    if (requestSeq.current === seq) {
      setContext(next);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // 职位切换通知：后台广播到达时重新拉取当前页面上下文
    const listener = (message: unknown): void => {
      if (readProperty(message, 'hiJobNotify') === 'job-context-changed') {
        void refresh();
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, [refresh]);

  return { context };
};

export { usePageJobContext };
