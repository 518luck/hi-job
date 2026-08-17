// # jd 表数据字典：落库实体为基座，传输 DTO 与消息信封从实体派生
import { z } from 'zod';

// 表 jd（职位明细）落库实体：主键 jobId，字段最全，是该表字段字典的唯一事实来源
const recordedJdSchema = z.object({
  jobId: z.string(), // 职位唯一 id，取自详情链接
  companyId: z.string(), // 公司唯一 id，匿名公司为 anonymous:<公司名>
  companyName: z.string(), // 公司名
  companyIndustry: z.string(), // 公司行业，取 Vue 原始数据（如 互联网），读不到为空串
  companyScale: z.string(), // 公司规模，取 Vue 原始数据（如 100-499人），读不到为空串
  title: z.string(), // 职位名称
  salary: z.string(), // 薪资文本，取页面 Vue 原始数据，读不到时回退 DOM 文本（可能被字体混淆）
  tags: z.array(z.string()), // 头部基本信息与技能标签合集
  recruiter: z.string(), // 招聘者信息，"公司 · 职位" 格式
  recruiterActive: z.string(), // 招聘者活跃状态（如 刚刚活跃），取详情面板 DOM，读不到为空串
  description: z.string(), // 职位描述全文
  address: z.string(), // 工作地址
  url: z.string(), // 职位详情链接
  firstSeenAt: z.number(), // 首次记录的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近记录的时间戳（毫秒）
  seenCount: z.number(), // 该职位被点开的总次数
});

// 传输 DTO：内容脚本回包的职位数据，从落库实体剔除记录元字段派生，禁止重复声明
const selectedJdSchema = recordedJdSchema.omit({
  firstSeenAt: true,
  lastSeenAt: true,
  seenCount: true,
});

// 传输 DTO：主世界从页面 Vue 实例读取的当前职位数据，公司字段从落库实体派生
const vueJobDataSchema = recordedJdSchema
  .pick({ companyIndustry: true, companyScale: true })
  .extend({
    salaryDesc: z.string(), // 原始薪资描述（如 10-15K），读不到为空串
    brandName: z.string(), // 公司名，取自 currentJob.brandName，读不到为空串
    bossOnline: z.boolean().optional(), // HR 是否在线，页面值缺失时缺省（展示为未知）
    bossActiveDesc: z.string(), // HR 活跃状态文本（如 刚刚活跃），取自详情面板 bossInfo，读不到为空串
  });

// 页面职位上下文：工作台查询当前 BOSS 标签页的页面类型与当前职位数据
const pageJobContextSchema = z.object({
  page: z.enum(['jobs', 'other']), // 当前页面类型：职位列表页 / 其他
  job: vueJobDataSchema.optional(), // 职位列表页时携带当前选中职位的数据，读不到缺省
});

// 传输 DTO：列表卡片的规模与行业，字段语义与落库实体一致
const vueJobCardSchema = recordedJdSchema.pick({
  companyIndustry: true,
  companyScale: true,
});

// 从 schema 派生类型，保持单一事实来源
type RecordedJd = z.infer<typeof recordedJdSchema>;
type SelectedJd = z.infer<typeof selectedJdSchema>;
type VueJobData = z.infer<typeof vueJobDataSchema>;
type VueJobCard = z.infer<typeof vueJobCardSchema>;
type PageJobContext = z.infer<typeof pageJobContextSchema>;

export type { PageJobContext, RecordedJd, SelectedJd, VueJobCard, VueJobData };
export {
  pageJobContextSchema,
  recordedJdSchema,
  selectedJdSchema,
  vueJobCardSchema,
  vueJobDataSchema,
};
