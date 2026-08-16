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
// company 表：落库实体
export type { CompanyRecord } from './company';
export { companyRecordSchema } from './company';
// friend-mark 表：HR 会话状态标记 + 读写消息信封
export type {
  FriendMark,
  GetFriendMarksMessage,
  SaveFriendMarkMessage,
} from './friend-mark';
export {
  FRIEND_MARK_STATUSES,
  friendMarkSchema,
  friendMarksResponseSchema,
  GET_FRIEND_MARKS,
  getFriendMarksMessageSchema,
  SAVE_FRIEND_MARK,
  saveFriendMarkMessageSchema,
} from './friend-mark';
// jd 表：落库实体 + 传输 DTO / 消息信封派生
export type { RecordedJd, SelectedJd } from './jd';
export {
  RECORD_JD,
  recordedJdSchema,
  recordJdMessageSchema,
  selectedJdSchema,
} from './jd';
// reply 消息：聊天页请求 AI 生成下一条回复
export type { GenerateReplyMessage, ReplyJd, ReplyMessage } from './reply';
export {
  GENERATE_REPLY,
  generateReplyMessageSchema,
  replyJdSchema,
  replyMessageSchema,
} from './reply';
