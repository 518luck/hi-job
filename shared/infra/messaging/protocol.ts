// # 扩展消息协议：ProtocolMap 集中定义后台运行时消息
import { defineExtensionMessaging } from '@webext-core/messaging';

import type {
  ChatMessageInput,
  DebugSettings,
  FollowUpInput,
  GreetingInput,
  HrInput,
  PageJobContext,
  RejectionFeedbackInput,
  ReplyInput,
  SelectedJd,
} from '@/shared/zod';

// 消息协议表：消息名 -> 参数与返回类型，隔离世界与后台两端编译期一致
interface ProtocolMap {
  recordJd(data: SelectedJd): void; // 隔离世界脚本	后台	保存职位
  saveHr(data: HrInput): void; // 主世界脚本（经桥）	后台	上报当前 HR 档案
  syncHrs(data: HrInput[]): void; // 主世界脚本（经桥）	后台	整批同步全部 HR 档案
  saveChatMessages(data: ChatMessageInput[]): void; // 主世界脚本（经桥）	后台	保存某会话的聊天消息
  getExcludedHrIds(): string[]; // 主世界脚本（经桥）	后台	获取被排除的 HR id 列表
  getChattedCompanyNames(): string[]; // 隔离世界脚本	后台	获取已沟通公司名列表（职位列表卡打标）
  hrsChanged(): void; // 侧边栏	后台	通知排除标记已变更（后台广播到聊天页重拉）
  getBlockedCompanyNames(): string[]; // 隔离世界脚本/侧边栏	后台	获取屏蔽公司名单
  saveBlockedCompanies(data: string[]): void; // 侧边栏	后台	保存屏蔽公司名单并广播到职位列表页
  getPageDebugLogs(): string[]; // 侧边栏	后台	读取当前 BOSS 页面的采集日志
  getPageJobContext(): PageJobContext; // 侧边栏	后台	读取当前 BOSS 页面的职位上下文（页面类型与当前职位数据）
  jobContextChanged(): void; // 隔离世界脚本	后台	通知职位选中已变化（后台广播到侧边栏刷新）
  getDebugSettings(): DebugSettings; // 主世界脚本（经桥）	后台	读取调试开关设置
  saveDebugSettings(data: DebugSettings): void; // 侧边栏	后台	保存调试开关设置并广播到页面
  greeting(data: GreetingInput): string; // 主世界脚本（经桥）	后台	生成打招呼语句
  followUp(data: FollowUpInput): string; // 主世界脚本（经桥）	后台	生成跟进消息
  generateReply(data: ReplyInput): string; // 隔离世界脚本	后台	调 AI 生成回复
  rejectionFeedback(data: RejectionFeedbackInput): string; // 主世界脚本（经桥）	后台	生成请教反馈消息
}

// 类型安全消息收发：隔离世界内容脚本与后台使用
const { onMessage, sendMessage } = defineExtensionMessaging<ProtocolMap>();

export type { ProtocolMap };
export { onMessage, sendMessage };
