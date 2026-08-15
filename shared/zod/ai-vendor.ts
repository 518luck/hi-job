// # ai-vendor 域数据字典：落库实体为基座，厂商表单从实体派生
import { z } from 'zod';

// 表 aiVendor（AI 厂商配置）落库实体：主键 vendorId
const aiVendorSchema = z.object({
  vendorId: z.string(), // 厂商配置唯一 id，创建时 crypto.randomUUID 生成
  name: z.string(), // 厂商名称（内置预设预填，可改）
  baseUrl: z.string(), // API 基础地址，如 https://api.deepseek.com
  apiKey: z.string(), // API 密钥，仅存本机 IndexedDB，不参与任何同步
  apiFormat: z.enum(['openai', 'anthropic']), // API 协议格式：openai 兼容或 anthropic
  models: z.array(z.string()), // 该厂商下可用的模型 id 列表
  createdAt: z.number(), // 首次创建时间戳（毫秒）
  updatedAt: z.number(), // 最近编辑时间戳（毫秒）
});

// 厂商表单：从落库实体剔除主键与时间戳（由仓储维护），extend 附加校验规则与错误文案
const vendorFormSchema = aiVendorSchema
  .omit({ vendorId: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().trim().min(1, '请填写厂商名称'), // 厂商名称
    baseUrl: z.url('Base URL 需为合法网址'), // API 基础地址
    apiKey: z.string().trim().min(1, '请填写 API Key'), // API 密钥
    models: z
      .array(z.string().min(1))
      .min(1, '至少填写一个模型，可点「拉取模型列表」'), // 模型 id 列表
  });

// 多行模型文本 → 模型 id 列表：逐行去空白，剔除空行
const modelLinesOf = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

// 弹窗表单：模型列表以多行文本收集，提交时经 modelLinesOf 还原为列表
const vendorDialogFormSchema = vendorFormSchema.omit({ models: true }).extend({
  modelsText: z.string().refine((text) => modelLinesOf(text).length > 0, {
    message: '至少填写一个模型，可点「拉取模型列表」',
  }), // 模型列表（每行一个）
});

// 从 schema 派生类型，保持单一事实来源
type AiVendorRecord = z.infer<typeof aiVendorSchema>;
type VendorFormValues = z.infer<typeof vendorFormSchema>;
type VendorDialogFormValues = z.infer<typeof vendorDialogFormSchema>;

export type { AiVendorRecord, VendorDialogFormValues, VendorFormValues };
export {
  aiVendorSchema,
  modelLinesOf,
  vendorDialogFormSchema,
  vendorFormSchema,
};
