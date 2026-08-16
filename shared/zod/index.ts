// # zod 数据字典公有 API：一表一文件的聚合出口，上层统一从 '@/shared/zod' 导入

// aiVendor 表：落库实体 + 厂商表单派生
export type {
  AiVendorRecord,
  VendorDialogFormValues,
  VendorFormValues,
} from './ai-vendor';
export {
  aiVendorSchema,
  modelLinesOf,
  vendorDialogFormSchema,
  vendorFormSchema,
} from './ai-vendor';
// chatSession 表：聊天会话档案
export type { ChatSession, ChatSessionInput } from './chat-session';
export { chatSessionInputSchema, chatSessionSchema } from './chat-session';
// company 表：落库实体
export type { CompanyRecord } from './company';
export { companyRecordSchema } from './company';
// friend-mark 表：HR 会话状态标记 + 操作输入
export type { FriendMark, FriendMarkInput } from './friend-mark';
export {
  FRIEND_MARK_STATUSES,
  friendMarkInputSchema,
  friendMarkSchema,
  friendMarksResponseSchema,
} from './friend-mark';
// jd 表：落库实体 + 传输 DTO
export type { RecordedJd, SelectedJd, VueJobCard, VueJobData } from './jd';
export {
  recordedJdSchema,
  selectedJdSchema,
  vueJobCardSchema,
  vueJobDataSchema,
} from './jd';
// reply 消息：聊天页请求 AI 生成下一条回复
export type { ReplyInput, ReplyJd, ReplyMessage } from './reply';
export { replyInputSchema, replyJdSchema, replyMessageSchema } from './reply';
