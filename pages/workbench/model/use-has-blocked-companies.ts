import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';

// 是否已有屏蔽公司：工作台据此决定是否展示配置引导入口
const useHasBlockedCompanies = (): boolean => {
  const [has, setHas] = useState(false);

  useEffect(() => {
    void sendMessage('getBlockedCompanyNames', undefined)
      .then((names) => {
        setHas(names.length > 0);
      })
      .catch(() => {
        // 后台不可达时保持 false，继续展示引导入口
      });
  }, []);

  return has;
};

export { useHasBlockedCompanies };
