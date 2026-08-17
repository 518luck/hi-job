// # AI 日志标签字典：思考档位、调用来源与筛选分类的中文文案
import type { AiLog } from '@/shared/zod';

// 思考档位与调用来源的中文标签
const THINKING_MODE_LABELS: Record<AiLog['thinkingMode'], string> = {
  default: '默认',
  off: '关闭',
  low: '低',
  medium: '中',
  high: '高',
};

const SOURCE_LABELS: Record<AiLog['source'], string> = {
  greeting: '打招呼',
  reply: '回复',
  followUp: '跟进',
};

// 日志分层筛选：全部或按来源
type LogFilter = 'all' | AiLog['source'];

// 各分类的说明文字：Tab 下方展示
const FILTER_DESCRIPTIONS: Record<LogFilter, string> = {
  all: '所有来源的 AI 调用日志，按时间倒序。',
  greeting:
    '首次联系招聘者时生成的打招呼语句（工作台「生成问候」/ 聊天窗「问候」）。',
  reply: '招聘者回复后生成的下一条回复（聊天窗「回复」）。',
  followUp: '已读不回或未读时生成的提醒问候（聊天窗「提醒」）。',
};

export type { LogFilter };
export { FILTER_DESCRIPTIONS, SOURCE_LABELS, THINKING_MODE_LABELS };
