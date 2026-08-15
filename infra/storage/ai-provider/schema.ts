// # ai-provider 领域表结构：字段字典与索引声明的单一事实来源
import { z } from 'zod';

// 表 aiProvider（AI 模型厂商配置）：主键 providerId，索引 name / updatedAt
const aiProviderSchema = z.object({
  providerId: z.string(), // 厂商配置唯一 id，创建时 crypto.randomUUID 生成
  name: z.string(), // 厂商名称（内置预设预填，可改）
  baseUrl: z.string(), // API 基础地址，如 https://api.deepseek.com
  apiKey: z.string(), // API 密钥，仅存本机 IndexedDB，不参与任何同步
  apiFormat: z.enum(['openai', 'anthropic']), // API 协议格式：openai 兼容或 anthropic
  models: z.array(z.string()), // 该厂商下可用的模型 id 列表
  createdAt: z.number(), // 首次创建时间戳（毫秒）
  updatedAt: z.number(), // 最近编辑时间戳（毫秒）
});

// 从 schema 派生表实体类型，保持单一事实来源
type AiProviderRecord = z.infer<typeof aiProviderSchema>;

// 表的 Dexie 索引声明：首字段为主键，其余为索引
const AI_PROVIDER_TABLES = {
  aiProvider: 'providerId, name, updatedAt',
} as const;

export type { AiProviderRecord };
export { AI_PROVIDER_TABLES, aiProviderSchema };
