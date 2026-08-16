// # 扩展消息协议：ProtocolMap 集中定义后台运行时消息
import { defineExtensionMessaging } from '@webext-core/messaging';

import type {
  FriendMark,
  FriendMarkInput,
  ReplyInput,
  SelectedJd,
} from '@/shared/zod';

// 消息协议表：消息名 -> 参数与返回类型，隔离世界与后台两端编译期一致
interface ProtocolMap {
  recordJd(data: SelectedJd): void; // 隔离世界脚本	后台	保存职位
  saveFriendMark(data: FriendMarkInput): void; // 隔离世界脚本	后台	保存 HR 标记
  getFriendMarks(): FriendMark[]; // 隔离世界脚本	后台	获取 HR 标记
  generateReply(data: ReplyInput): string; // 隔离世界脚本	后台	调 AI 生成回复
}

// 类型安全消息收发：隔离世界内容脚本与后台使用
const { onMessage, sendMessage } = defineExtensionMessaging<ProtocolMap>();

export type { ProtocolMap };
export { onMessage, sendMessage };
