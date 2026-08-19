// # ai 域公有 API：厂商客户端与生成场景

export type { StreamCallbacks } from './ai-stream';
export { cancelAiStream, startAiStream } from './ai-stream';
export {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  DEFAULT_REJECTION_FEEDBACK_REQUIREMENT,
  DEFAULT_REJECTION_FEEDBACK_SYSTEM,
  DEFAULT_REJECTION_FEEDBACK_TASK,
  DEFAULT_REPLY_REQUIREMENT,
  DEFAULT_REPLY_SYSTEM,
  DEFAULT_REPLY_TASK,
  DEFAULT_RESUME_ORGANIZE_REQUIREMENT,
  DEFAULT_RESUME_ORGANIZE_SYSTEM,
  DEFAULT_RESUME_ORGANIZE_TASK,
  generateFollowUp,
  generateGreeting,
  generateOrganizedResume,
  generateRejectionFeedback,
  generateReply,
  hrSectionOf,
  resumeSectionOf,
} from './scenes';
export type { AiStreamCallbacks } from './vendor-client';
export {
  AUTH_ERROR_MARKER,
  chatWithVendor,
  createVendorClient,
  fetchVendorModels,
} from './vendor-client';
