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

// 清空简历：删除后 AI 提示词不再注入简历
const clearResume = (): Promise<void> => db.resume.delete(RESUME_KEY);

// 保存 AI 梳理结果：正文替换为梳理版，原件首次备份（二次梳理不覆盖最初原件）
const saveOrganizedContent = async (content: string): Promise<void> => {
  const current = await readResume();
  if (current === undefined) {
    return;
  }
  await db.resume.put({
    ...current,
    content,
    originalContent: current.originalContent ?? current.content,
    updatedAt: Date.now(),
  });
};

// 恢复原版：备份原件写回正文并清除备份，未梳理过时不动作
const restoreOriginal = async (): Promise<void> => {
  const current = await readResume();
  if (current?.originalContent === undefined) {
    return;
  }
  const { originalContent, ...rest } = current;
  await db.resume.put({
    ...rest,
    content: originalContent,
    updatedAt: Date.now(),
  });
};

// resume 领域仓储：用户简历（单行）的统一读写入口
const resumeStore = {
  saveResume, // 保存简历（覆盖写入）
  readResume, // 读取简历（未上传时 undefined）
  clearResume, // 清空简历
  saveOrganizedContent, // 保存 AI 梳理结果（原件自动备份）
  restoreOriginal, // 恢复梳理前的原件
};

export { resumeStore };
