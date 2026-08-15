// # zod 数据字典公有 API：一表一文件的聚合出口，上层统一从 '@/shared/zod' 导入

// aiVendor 表：落库实体 + 厂商表单派生
export type { AiVendorRecord, VendorFormValues } from './ai-vendor';
export { aiVendorSchema, vendorFormSchema } from './ai-vendor';
// company 表：落库实体
export type { CompanyRecord } from './company';
export { companyRecordSchema } from './company';
// 通用工具：zod 校验错误提取
export { fieldErrorsOf } from './field-errors';
// jd 表：落库实体 + 传输 DTO / 消息信封派生
export type { RecordedJd, SelectedJd } from './jd';
export {
  RECORD_JD,
  recordedJdSchema,
  recordJdMessageSchema,
  selectedJdSchema,
} from './jd';
