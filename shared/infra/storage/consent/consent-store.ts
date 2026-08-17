// # consent 领域仓储：用户确认记录的统一读写入口
import { CONSENT_KEY } from '@/shared/zod';

import { db } from '../db';

// 读取免责声明确认时间：未确认时返回 undefined
const readDisclaimerAcceptedAt = async (): Promise<number | undefined> =>
  (await db.consent.get(CONSENT_KEY))?.disclaimerAcceptedAt;

// 确认免责声明：写入确认时间戳，此后启动不再弹窗
const acceptDisclaimer = async (): Promise<void> => {
  await db.consent.put({
    key: CONSENT_KEY,
    disclaimerAcceptedAt: Date.now(),
  });
};

// consent 领域仓储：用户确认记录的统一读写入口
const consentStore = {
  readDisclaimerAcceptedAt, // 读取免责声明确认时间
  acceptDisclaimer, // 写入免责声明确认
};

export { consentStore };
