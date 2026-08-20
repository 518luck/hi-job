// # resumeSupplement 表数据字典：简历外补充素材（单行，工作台录入）
import { z } from 'zod';

// 表 resumeSupplement（简历外补充）落库实体：主键 key，单行
const resumeSupplementSchema = z.object({
  key: z.literal('global'), // 单行固定主键
  content: z.string().max(2000), // 简历外补充全文（浅层经历谈资，上限 2000 字）
  updatedAt: z.number(), // 更新时间戳（毫秒）
});

// 补充写入输入：去掉存储主键与时间戳，由仓储维护
const resumeSupplementInputSchema = resumeSupplementSchema.omit({
  key: true,
  updatedAt: true,
});

// 从 schema 派生类型，保持单一事实来源
type ResumeSupplementRecord = z.infer<typeof resumeSupplementSchema>;
type ResumeSupplementInput = z.infer<typeof resumeSupplementInputSchema>;

export type { ResumeSupplementInput, ResumeSupplementRecord };
export { resumeSupplementInputSchema, resumeSupplementSchema };
