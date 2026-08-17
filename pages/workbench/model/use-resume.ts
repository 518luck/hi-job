import { useLiveQuery } from 'dexie-react-hooks';

import { resumeStore } from '@/shared/infra/storage';
import type { ResumeRecord } from '@/shared/zod';

import { parseResumeFile } from './parse-resume';

// 工作台简历数据：读取、上传解析入库与清空
const useResume = (): {
  resume?: ResumeRecord;
  upload: (file: File) => Promise<void>;
  clear: () => Promise<void>;
} => {
  const resume = useLiveQuery(() => resumeStore.readResume(), []);

  // 上传简历：解析为 Markdown 后覆盖写入
  const upload = async (file: File): Promise<void> => {
    const parsed = await parseResumeFile(file);
    await resumeStore.saveResume(parsed);
  };

  // 清空简历：删除后 AI 不再注入
  const clear = async (): Promise<void> => {
    await resumeStore.clearResume();
  };

  return {
    resume,
    upload,
    clear,
  };
};

export { useResume };
