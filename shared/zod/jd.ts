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

// 内容脚本向后台发送记录请求的消息类型
const RECORD_JD = 'hi-job:record-jd';

// 记录消息的校验 schema：后台收到跨环境无类型消息后用它校验
const recordJdMessageSchema = z.object({
  type: z.literal(RECORD_JD), // 消息类型标识
  jd: selectedJdSchema, // 待记录的职位数据
});

// 从 schema 派生类型，保持单一事实来源
type SelectedJd = z.infer<typeof selectedJdSchema>;

export type { SelectedJd };
export { RECORD_JD, recordJdMessageSchema, selectedJdSchema };
