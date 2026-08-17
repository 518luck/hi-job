// # blocked-company 表数据字典：屏蔽公司名单设置
import { z } from 'zod';

// 单行固定主键：屏蔽名单只有一份，key 恒为 global
const BLOCKED_COMPANY_KEY = 'global';

// 表 blockedCompany（屏蔽公司名单）落库实体：主键 key
const blockedCompanySchema = z.object({
  key: z.literal(BLOCKED_COMPANY_KEY), // 单行固定主键
  names: z.array(z.string()), // 屏蔽的公司名列表，职位列表页按包含匹配（不区分大小写）
});

// 协议传输的屏蔽名单：从落库实体 names 字段派生的纯数组
const blockedCompanyNamesSchema = blockedCompanySchema.shape.names;

// 从 schema 派生类型，保持单一事实来源
type BlockedCompany = z.infer<typeof blockedCompanySchema>;
type BlockedCompanyNames = z.infer<typeof blockedCompanyNamesSchema>;

export type { BlockedCompany, BlockedCompanyNames };
export { BLOCKED_COMPANY_KEY, blockedCompanyNamesSchema, blockedCompanySchema };
