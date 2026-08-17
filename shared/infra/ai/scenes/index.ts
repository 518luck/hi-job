// # 生成场景域公有 API：各场景生成函数、默认文案与公共拼接段

export {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  generateFollowUp,
} from './follow-up';
export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  generateGreeting,
} from './greeting';
export { hrSectionOf, resumeSectionOf } from './prompt-parts';
export {
  DEFAULT_REJECTION_FEEDBACK_REQUIREMENT,
  DEFAULT_REJECTION_FEEDBACK_SYSTEM,
  DEFAULT_REJECTION_FEEDBACK_TASK,
  generateRejectionFeedback,
} from './rejection-feedback';
export {
  DEFAULT_REPLY_REQUIREMENT,
  DEFAULT_REPLY_SYSTEM,
  DEFAULT_REPLY_TASK,
  generateReply,
} from './reply';
