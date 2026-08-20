import { useLiveQuery } from 'dexie-react-hooks';

import { sendMessage } from '@/shared/infra/messaging';
import { resumeStore } from '@/shared/infra/storage';
import type { ResumeRecord } from '@/shared/zod';

import { parseResumeFile } from './parse-resume';

// 工作台简历数据：读取、上传解析入库、AI 梳理与清空
const useResume = (): {
  resume?: ResumeRecord;
  loaded: boolean;
  upload: (file: File) => Promise<void>;
  organize: () => Promise<void>;
  restore: () => Promise<void>;
  clear: () => Promise<void>;
} => {
  // 查询结果三态：undefined 加载中 / null 无简历 / 记录 已上传——区分加载与未上传，供 UI 避免初始误判闪状态
  const query = useLiveQuery(
    () => resumeStore.readResume().then((record) => record ?? null),
    [],
  );
  const loaded = query !== undefined;
  const resume = query ?? undefined;

  // 上传简历：解析为 Markdown 后覆盖写入
  const upload = async (file: File): Promise<void> => {
    const parsed = await parseResumeFile(file);
    await resumeStore.saveResume(parsed);
  };

  // AI 梳理简历：经后台用所选模型生成整理版，落库时自动备份原件
  const organize = async (): Promise<void> => {
    const organized = await sendMessage('organizeResume');
    await resumeStore.saveOrganizedContent(organized);
  };

  // 恢复原版：把梳理前的原件写回正文并清除备份
  const restore = async (): Promise<void> => {
    await resumeStore.restoreOriginal();
  };

  // 清空简历：删除后 AI 不再注入
  const clear = async (): Promise<void> => {
    await resumeStore.clearResume();
  };

  return {
    resume,
    loaded,
    upload,
    organize,
    restore,
    clear,
  };
};

export { useResume };
