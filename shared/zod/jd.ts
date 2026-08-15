import { z } from 'zod';

// 职位（JD）数据 schema：内容脚本回包是跨环境传来的无类型数据，收包时用它校验
const selectedJdSchema = z.object({
  jobId: z.string(), // 职位唯一 id，取自详情链接
  companyId: z.string(), // 公司唯一 id，匿名公司为 anonymous:<公司名>
  companyName: z.string(), // 公司名
  title: z.string(), // 职位名称
  salary: z.string(), // 薪资文本，站点脱敏时为 "-K"
  tags: z.array(z.string()), // 头部基本信息与技能标签合集
  recruiter: z.string(), // 招聘者信息，"公司 · 职位" 格式
  description: z.string(), // 职位描述全文
  address: z.string(), // 工作地址
  url: z.string(), // 职位详情链接
});

// 已记录的职位：在抓取结果上附加出现时间与次数
const recordedJdSchema = selectedJdSchema.extend({
  firstSeenAt: z.number(), // 首次记录的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近记录的时间戳（毫秒）
  seenCount: z.number(), // 该职位被点开的总次数
});

// 公司维度的推送记录：该公司推送过的职位 id 列表与首末出现时间
const companyRecordSchema = z.object({
  companyId: z.string(), // 公司唯一 id，与 selectedJdSchema 的 companyId 一致
  companyName: z.string(), // 公司名
  jobIds: z.array(z.string()), // 该公司推送过的全部职位 id
  firstSeenAt: z.number(), // 首次出现的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近出现的时间戳（毫秒）
});

// 存储索引：所有已记录的职位 id 与公司 id
const storeIndexSchema = z.object({
  jobIds: z.array(z.string()), // 全部已记录的职位 id
  companyIds: z.array(z.string()), // 全部已记录的公司 id
});

// 从 schema 派生类型，保持单一事实来源
type SelectedJd = z.infer<typeof selectedJdSchema>;
type RecordedJd = z.infer<typeof recordedJdSchema>;
type CompanyRecord = z.infer<typeof companyRecordSchema>;
type StoreIndex = z.infer<typeof storeIndexSchema>;

export type { CompanyRecord, RecordedJd, SelectedJd, StoreIndex };
export {
  companyRecordSchema,
  recordedJdSchema,
  selectedJdSchema,
  storeIndexSchema,
};
