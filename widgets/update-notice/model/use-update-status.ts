import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import type { UpdateCheckStatus } from '@/shared/zod';

// 工作台与设置页共用的更新状态：挂载时问后台要一次（后台自带 1 小时缓存）
const useUpdateStatus = (): { status?: UpdateCheckStatus } => {
  const [status, setStatus] = useState<UpdateCheckStatus>();

  useEffect(() => {
    // 检查失败静默处理：调用方拿到 undefined 即不渲染任何提示
    sendMessage('checkUpdate')
      .then(setStatus)
      .catch(() => undefined);
  }, []);

  return { status };
};

export { useUpdateStatus };
