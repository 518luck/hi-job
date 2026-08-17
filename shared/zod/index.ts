// # zod 数据字典公有 API：一表一文件的聚合出口，上层统一从 '@/shared/zod' 导入

// aiLog 表：AI 调用日志（调试用）
export type { AiLog, AiLogInput, AiLogSource, ScenePrompt } from './ai-log';
export { aiLogInputSchema, aiLogSchema, scenePromptSchema } from './ai-log';
// aiPreference 表：AI 调用全局偏好（厂商/模型选择 + 思考模式）+ 协议 DTO
export type {
  AiPreference,
  AiPreferenceInput,
  ThinkingMode,
} from './ai-preference';
export {
  aiPreferenceInputSchema,
  aiPreferenceSchema,
  THINKING_MODES,
} from './ai-preference';
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
// blockedCompany 表：屏蔽公司名单设置 + 协议 DTO
export type { BlockedCompany, BlockedCompanyNames } from './blocked-company';
export {
  BLOCKED_COMPANY_KEY,
  blockedCompanyNamesSchema,
  blockedCompanySchema,
} from './blocked-company';
// chat-message 表：与 HR 的逐条聊天消息
export type { ChatMessage, ChatMessageInput } from './chat-message';
export { chatMessageInputSchema, chatMessageSchema } from './chat-message';
// company 表：落库实体
export type { CompanyRecord } from './company';
export { companyRecordSchema } from './company';
// consent 表：用户一次性确认记录（免责声明）
export type { ConsentRecord } from './consent';
export { CONSENT_KEY, consentRecordSchema } from './consent';
// debug-log 消息：页面采集日志查询 DTO
export type { DebugLogLines } from './debug-log';
export { debugLogLinesSchema } from './debug-log';
// debugSetting 表：调试功能开关设置 + 协议 DTO
export type { DebugSetting, DebugSettings } from './debug-setting';
export {
  DEBUG_SETTING_KEY,
  debugSettingSchema,
  debugSettingsSchema,
} from './debug-setting';
// follow-up 消息：聊天页请求 AI 生成跟进消息
export type { FollowUpInput } from './follow-up';
export { followUpInputSchema } from './follow-up';
// greeting 消息：聊天页请求 AI 生成打招呼语句
export type { GreetingInput } from './greeting';
export { greetingInputSchema } from './greeting';
// hr 表：HR 档案底表 + 自标状态 + HR 信息派生
export type { Hr, HrInfo, HrInput } from './hr';
export {
  excludedHrIdsResponseSchema,
  HR_STATUSES,
  hrInfoSchema,
  hrInputSchema,
  hrSchema,
} from './hr';
// jd 表：落库实体 + 传输 DTO
export type { RecordedJd, SelectedJd, VueJobCard, VueJobData } from './jd';
export {
  recordedJdSchema,
  selectedJdSchema,
  vueJobCardSchema,
  vueJobDataSchema,
} from './jd';
// rejection-feedback 消息：聊天页请求 AI 生成招聘流程结束后的反馈请教消息
export type { RejectionFeedbackInput } from './rejection-feedback';
export { rejectionFeedbackInputSchema } from './rejection-feedback';
// reply 消息：聊天页请求 AI 生成下一条回复
export type { ReplyInput, ReplyJd, ReplyMessage } from './reply';
export { replyInputSchema, replyJdSchema, replyMessageSchema } from './reply';
// resume 表：用户简历（单行，UI 上传入口预留）
export type { ResumeInput, ResumeRecord } from './resume';
export { resumeInputSchema, resumeSchema } from './resume';
