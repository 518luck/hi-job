// # jd 域数据字典：落库实体为基座，传输 DTO 与消息信封从实体派生
import { z } from 'zod';

// 表 jd（职位明细）落库实体：主键 jobId，字段最全，是该域字段字典的唯一事实来源
const recordedJdSchema = z.object({
  jobId: z.string(), // 职位唯一 id，取自详情链接
  companyId: z.string(), // 公司唯一 id，匿名公司为 anonymous:<公司名>
  companyName: z.string(), // 公司名
  title: z.string(), // 职位名称
  salary: z.string(), // 薪资文本，取页面 Vue 原始数据，读不到时回退 DOM 文本（可能被字体混淆）
  tags: z.array(z.string()), // 头部基本信息与技能标签合集
  recruiter: z.string(), // 招聘者信息，"公司 · 职位" 格式
  description: z.string(), // 职位描述全文
  address: z.string(), // 工作地址
  url: z.string(), // 职位详情链接
  firstSeenAt: z.number(), // 首次记录的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近记录的时间戳（毫秒）
  seenCount: z.number(), // 该职位被点开的总次数
});

// 表 company（公司推送聚合）落库实体：主键 companyId
const companyRecordSchema = z.object({
  companyId: z.string(), // 公司唯一 id，与 recordedJdSchema 的 companyId 一致
  companyName: z.string(), // 公司名
  jobIds: z.array(z.string()), // 该公司推送过的全部职位 id
  firstSeenAt: z.number(), // 首次出现的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近出现的时间戳（毫秒）
});

// 传输 DTO：内容脚本回包的职位数据，从落库实体剔除记录元字段派生，禁止重复声明
const selectedJdSchema = recordedJdSchema.omit({
  firstSeenAt: true,
  lastSeenAt: true,
  seenCount: true,
});

// 内容脚本向后台发送记录请求的消息类型
const RECORD_JD = 'hi-job:record-jd';

// 消息信封：后台收到跨环境无类型消息后用它校验
const recordJdMessageSchema = z.object({
  type: z.literal(RECORD_JD), // 消息类型标识
  jd: selectedJdSchema, // 待记录的职位数据
});

// 从 schema 派生类型，保持单一事实来源
type RecordedJd = z.infer<typeof recordedJdSchema>;
type CompanyRecord = z.infer<typeof companyRecordSchema>;
type SelectedJd = z.infer<typeof selectedJdSchema>;

export type { CompanyRecord, RecordedJd, SelectedJd };
export {
  companyRecordSchema,
  RECORD_JD,
  recordedJdSchema,
  recordJdMessageSchema,
  selectedJdSchema,
};
