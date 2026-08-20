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

// 来源中文标签：与聊天窗场景按钮、日志筛选 Tab 共用同一套短文案与顺序
const SOURCE_LABELS: Record<AiLog['source'], string> = {
  greeting: '问候',
  reply: '回复',
  followUp: '提醒',
  rejectionFeedback: '反馈',
  resumeOrganize: '简历',
};

// 日志分层筛选：全部或按来源
type LogFilter = 'all' | AiLog['source'];

// 各分类的说明文字：Tab 下方展示
const FILTER_DESCRIPTIONS: Record<LogFilter, string> = {
  all: '所有来源的 AI 调用日志，按时间倒序。',
  greeting: '首次联系招聘者时生成的打招呼消息（聊天窗「问候」）。',
  reply: '结合当前聊天记录生成的下一条回复（聊天窗「回复」）。',
  followUp: '招聘沟通暂时中断时生成的跟进消息（聊天窗「提醒」）。',
  rejectionFeedback: '招聘流程结束后生成的反馈请教消息（聊天窗「反馈」）。',
  resumeOrganize: '工作台简历卡发起的 AI 梳理调用（「AI 梳理」按钮）。',
};

export type { LogFilter };
export { FILTER_DESCRIPTIONS, SOURCE_LABELS, THINKING_MODE_LABELS };
