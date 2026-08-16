// # friend-mark 表数据字典：聊天页 HR 会话的状态标记
import { z } from 'zod';

// 标记状态集合：先支持「失败」，后续可扩展其他状态
const FRIEND_MARK_STATUSES = ['failed'] as const;

// 表 friendMark（HR 会话标记）落库实体：主键 encryptBossId
const friendMarkSchema = z.object({
  encryptBossId: z.string(), // HR 会话唯一 id（BOSS 加密 id）
  status: z.enum(FRIEND_MARK_STATUSES), // 标记状态，如 failed 表示失败
  updatedAt: z.number(), // 最近标记时间戳（毫秒）
});

// 内容脚本向后台保存/清除标记的消息类型
const SAVE_FRIEND_MARK = 'hi-job:save-friend-mark';

// 内容脚本向后台拉取全部标记的消息类型
const GET_FRIEND_MARKS = 'hi-job:get-friend-marks';

// 保存标记消息信封：status 为 null 表示清除该会话的标记
const saveFriendMarkMessageSchema = z.object({
  type: z.literal(SAVE_FRIEND_MARK), // 消息类型标识
  encryptBossId: z.string(), // 目标 HR 会话 id
  status: z.enum(FRIEND_MARK_STATUSES).nullable(), // 标记状态，null 清除
});

// 拉取全部标记的消息信封
const getFriendMarksMessageSchema = z.object({
  type: z.literal(GET_FRIEND_MARKS), // 消息类型标识
});

// 拉取标记的应答：全部标记数组，聊天页初始化渲染用
const friendMarksResponseSchema = z.array(friendMarkSchema);

// 从 schema 派生类型，保持单一事实来源
type FriendMark = z.infer<typeof friendMarkSchema>;
type GetFriendMarksMessage = z.infer<typeof getFriendMarksMessageSchema>;
type SaveFriendMarkMessage = z.infer<typeof saveFriendMarkMessageSchema>;

export type { FriendMark, GetFriendMarksMessage, SaveFriendMarkMessage };
export {
  FRIEND_MARK_STATUSES,
  friendMarkSchema,
  friendMarksResponseSchema,
  GET_FRIEND_MARKS,
  getFriendMarksMessageSchema,
  SAVE_FRIEND_MARK,
  saveFriendMarkMessageSchema,
};
