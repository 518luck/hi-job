// # 跨环境消息协议：ProtocolMap 集中定义全部运行时消息，桥协议统一信封
import { defineExtensionMessaging } from '@webext-core/messaging';
import { z } from 'zod';

import type {
  FriendMark,
  FriendMarkInput,
  ReplyInput,
  SelectedJd,
} from '@/shared/zod';

// 消息协议表：消息名 -> 参数与返回类型，隔离世界与后台两端编译期一致
interface ProtocolMap {
  recordJd(data: SelectedJd): void; // 记录用户点开的职位
  saveFriendMark(data: FriendMarkInput): void; // 保存/清除 HR 会话标记
  getFriendMarks(): FriendMark[]; // 拉取全部 HR 会话标记
  generateReply(data: ReplyInput): string; // 生成求职者的下一条回复
}

// 类型安全消息收发：隔离世界内容脚本与后台使用（主世界无 chrome API，走桥）
const { onMessage, sendMessage } = defineExtensionMessaging<ProtocolMap>();

// 桥请求/应答消息类型标识（主世界 <-> 隔离世界 postMessage 信封）
const BRIDGE_REQUEST = 'hi-job:bridge-request';
const BRIDGE_RESPONSE = 'hi-job:bridge-response';

// 桥请求信封：协议名 + 数据，隔离世界按协议名转发后台
const bridgeRequestSchema = z.object({
  type: z.literal(BRIDGE_REQUEST), // 消息类型标识
  requestId: z.string(), // 请求配对 id
  protocol: z.string(), // ProtocolMap 消息名
  data: z.unknown(), // 协议参数
});

// 桥应答信封：成功携带 response，失败携带 error
const bridgeResponseSchema = z.object({
  type: z.literal(BRIDGE_RESPONSE), // 消息类型标识
  requestId: z.string(), // 与请求配对
  ok: z.boolean(), // 是否成功
  response: z.unknown().optional(), // 后台应答
  error: z.string().optional(), // 失败信息
});

// 从 schema 派生类型，保持单一事实来源
type BridgeRequest = z.infer<typeof bridgeRequestSchema>;
type BridgeResponse = z.infer<typeof bridgeResponseSchema>;

export type { BridgeRequest, BridgeResponse, ProtocolMap };
export {
  BRIDGE_REQUEST,
  BRIDGE_RESPONSE,
  bridgeRequestSchema,
  bridgeResponseSchema,
  onMessage,
  sendMessage,
};
