import { useEffect, useState } from 'react';

import { API_LATEST_RELEASE } from '../lib/site';

// 拉取 GitHub 最新 Release 的 tag 作为版本号展示；失败时置 failed 由调用方兜底
export const useLatestVersion = (): { version: string; failed: boolean } => {
  const [version, setVersion] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_LATEST_RELEASE, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { tag_name?: unknown }) => {
        if (typeof data.tag_name === 'string') setVersion(data.tag_name);
        else throw new Error('unexpected response shape');
      })
      // 清理触发的 abort 不是真实失败，避免误显兜底文案
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return { version, failed };
};
