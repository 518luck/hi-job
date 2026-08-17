import { useEffect, useState } from 'react';

import { consentStore } from '@/shared/infra/storage';

import { DISCLAIMER_COUNTDOWN_SECONDS } from '../config/disclaimer-text';

// 免责声明确认状态：挂载时读取确认记录，未确认时倒计时归零方可确认
const useDisclaimer = (): {
  visible: boolean; // 是否展示弹窗（读取完成且未确认）
  seconds: number; // 剩余倒计时秒数，0 为可确认
  accept: () => Promise<void>;
} => {
  const [accepted, setAccepted] = useState<boolean | undefined>();
  const [seconds, setSeconds] = useState(DISCLAIMER_COUNTDOWN_SECONDS);

  useEffect(() => {
    void consentStore
      .readDisclaimerAcceptedAt()
      .then((at) => {
        setAccepted(at !== undefined);
      })
      .catch(() => {
        // 读库失败按未确认处理：展示弹窗，确认时再尝试写入
        setAccepted(false);
      });
  }, []);

  // 倒计时：仅弹窗展示期间走秒，归零即停
  useEffect(() => {
    if (accepted !== false || seconds === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [accepted, seconds]);

  const accept = async (): Promise<void> => {
    await consentStore.acceptDisclaimer();
    setAccepted(true);
  };

  return { visible: accepted === false, seconds, accept };
};

export { useDisclaimer };
