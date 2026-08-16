// # resume 领域仓储：用户简历（单行）的统一读写入口
import type { ResumeInput, ResumeRecord } from '@/shared/zod';

import { db } from '../db';

// 单行固定主键：简历只有一份
const RESUME_KEY = 'global';

// 保存简历：单行覆盖写入，更新时间戳
const saveResume = async (input: ResumeInput): Promise<void> => {
  await db.resume.put({
    key: RESUME_KEY,
    ...input,
    updatedAt: Date.now(),
  });
};

// 读取简历：未上传时返回 undefined
const readResume = async (): Promise<ResumeRecord | undefined> =>
  db.resume.get(RESUME_KEY);

// resume 领域仓储：用户简历（单行）的统一读写入口
const resumeStore = {
  saveResume, // 保存简历（覆盖写入）
  readResume, // 读取简历（未上传时 undefined）
};

export { resumeStore };
