// # resume 表数据字典：用户简历（单行，UI 上传入口预留）
import { z } from 'zod';

// 表 resume（用户简历）落库实体：主键 key，单行
const resumeSchema = z.object({
  key: z.literal('global'), // 单行固定主键
  fileName: z.string(), // 简历文件名（md 等）
  content: z.string(), // 简历全文文本
  updatedAt: z.number(), // 更新时间戳（毫秒）
});

// 简历写入输入：去掉存储主键与时间戳，由仓储维护
const resumeInputSchema = resumeSchema.omit({ key: true, updatedAt: true });

// 从 schema 派生类型，保持单一事实来源
type ResumeRecord = z.infer<typeof resumeSchema>;
type ResumeInput = z.infer<typeof resumeInputSchema>;

export type { ResumeInput, ResumeRecord };
export { resumeInputSchema, resumeSchema };
