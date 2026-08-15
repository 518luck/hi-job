// # company 表数据字典：公司推送聚合落库实体
import { z } from 'zod';

// 表 company（公司推送聚合）落库实体：主键 companyId
const companyRecordSchema = z.object({
  companyId: z.string(), // 公司唯一 id，与 jd 表 recordedJdSchema 的 companyId 一致
  companyName: z.string(), // 公司名
  industryName: z.string(), // 公司行业（每次记录刷新为最新值）
  scaleName: z.string(), // 公司规模（每次记录刷新为最新值）
  jobIds: z.array(z.string()), // 该公司推送过的全部职位 id
  firstSeenAt: z.number(), // 首次出现的时间戳（毫秒）
  lastSeenAt: z.number(), // 最近出现的时间戳（毫秒）
});

// 从 schema 派生类型，保持单一事实来源
type CompanyRecord = z.infer<typeof companyRecordSchema>;

export type { CompanyRecord };
export { companyRecordSchema };
