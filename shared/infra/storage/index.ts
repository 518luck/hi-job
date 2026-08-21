// # storage 域公有 API：聚合导出各领域仓储与表实体类型

export { aiLogStore } from './ai-log';
export { aiPreferenceStore, DEFAULT_AI_PREFERENCE } from './ai-preference';
export type { AiVendorRecord } from './ai-vendor';
export { aiVendorStore } from './ai-vendor';
export { blockedCompanyStore } from './blocked-company';
export { chatMessageStore } from './chat-message';
export { consentStore } from './consent';
export { DEFAULT_DEBUG_SETTINGS, debugSettingStore } from './debug-setting';
export { hrStore } from './hr';
export type { CompanyRecord, RecordedJd } from './jd';
export { jdStore } from './jd';
export { resumeStore } from './resume';
export { resumeSupplementStore } from './resume-supplement';
export type { OriginUsage } from './storage-usage';
export { storageUsageStore } from './storage-usage';
export { updateCheckStore } from './update-check';
