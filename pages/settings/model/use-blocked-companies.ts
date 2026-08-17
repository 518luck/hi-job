import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';

// 设置页屏蔽公司名单：挂载时读取，批量增删/清空时乐观更新并保存（后台负责落库与广播刷新）
const useBlockedCompanies = (): {
  names: string[];
  addNames: (list: readonly string[]) => Promise<void>;
  removeName: (name: string) => Promise<void>;
  clearNames: () => Promise<void>;
} => {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    void sendMessage('getBlockedCompanyNames', undefined).then(setNames);
  }, []);

  const save = async (next: string[]): Promise<void> => {
    setNames(next);
    await sendMessage('saveBlockedCompanies', next);
  };

  const addNames = async (list: readonly string[]): Promise<void> => {
    const next = [...names];
    for (const raw of list) {
      const name = raw.trim();
      if (name !== '' && !next.includes(name)) {
        next.push(name);
      }
    }
    if (next.length === names.length) {
      return;
    }
    await save(next);
  };

  const removeName = async (name: string): Promise<void> => {
    await save(names.filter((item) => item !== name));
  };

  const clearNames = async (): Promise<void> => {
    await save([]);
  };

  return { names, addNames, removeName, clearNames };
};

export { useBlockedCompanies };
