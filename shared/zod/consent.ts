// # consent 表数据字典：用户一次性确认记录（免责声明等）
import { z } from 'zod';

// 单行固定主键：确认记录只有一份，key 恒为 global
const CONSENT_KEY = 'global';

// 表 consent（用户确认记录）落库实体：主键 key
const consentRecordSchema = z.object({
  key: z.literal(CONSENT_KEY), // 单行固定主键
  disclaimerAcceptedAt: z.number(), // 确认免责声明的时间戳（毫秒），无记录表示未确认
});

// 从 schema 派生类型，保持单一事实来源
type ConsentRecord = z.infer<typeof consentRecordSchema>;

export type { ConsentRecord };
export { CONSENT_KEY, consentRecordSchema };
