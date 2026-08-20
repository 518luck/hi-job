// # resume-supplement 领域仓储：简历外补充素材（单行）的统一读写入口
import type { ResumeSupplementRecord } from '@/shared/zod';

import { db } from '../db';

// 单行固定主键：补充素材只有一份
const RESUME_SUPPLEMENT_KEY = 'global';

// 保存补充素材：单行覆盖写入，更新时间戳
const saveResumeSupplement = async (content: string): Promise<void> => {
  await db.resumeSupplement.put({
    key: RESUME_SUPPLEMENT_KEY,
    content,
    updatedAt: Date.now(),
  });
};

// 读取补充素材：未录入时返回 undefined
const readResumeSupplement = async (): Promise<
  ResumeSupplementRecord | undefined
> => db.resumeSupplement.get(RESUME_SUPPLEMENT_KEY);

// resume-supplement 领域仓储：简历外补充素材的统一读写入口
const resumeSupplementStore = {
  saveResumeSupplement, // 保存补充素材（覆盖写入）
  readResumeSupplement, // 读取补充素材（未录入时 undefined）
};

export { resumeSupplementStore };
