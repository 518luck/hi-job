// # 厂商表单校验 schema：弹窗提交前校验五个业务字段
import { z } from 'zod';

// 厂商表单值：业务字段与 AiProviderRecord 一致，主键与时间戳由仓储维护
const providerFormSchema = z.object({
  name: z.string().min(1, '请填写厂商名称'), // 厂商名称
  baseUrl: z.url('Base URL 需为合法网址'), // API 基础地址
  apiKey: z.string().min(1, '请填写 API Key'), // API 密钥
  apiFormat: z.enum(['openai', 'anthropic']), // API 协议格式
  models: z
    .array(z.string().min(1))
    .min(1, '至少填写一个模型，可点「拉取模型列表」'), // 模型 id 列表
});

// 从 schema 派生类型，保持单一事实来源
type ProviderFormValues = z.infer<typeof providerFormSchema>;

// 提取校验错误：按字段名取每个字段的第一条错误信息
const fieldErrorsOf = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
};

export type { ProviderFormValues };
export { fieldErrorsOf, providerFormSchema };
