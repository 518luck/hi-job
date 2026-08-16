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

// 标记操作的输入数据：status 为 null 表示清除该会话的标记
const friendMarkInputSchema = z.object({
  encryptBossId: z.string(), // 目标 HR 会话 id
  status: z.enum(FRIEND_MARK_STATUSES).nullable(), // 标记状态，null 清除
});

// 拉取标记的应答：全部标记数组，聊天页初始化渲染用
const friendMarksResponseSchema = z.array(friendMarkSchema);

// 从 schema 派生类型，保持单一事实来源
type FriendMark = z.infer<typeof friendMarkSchema>;
type FriendMarkInput = z.infer<typeof friendMarkInputSchema>;

export type { FriendMark, FriendMarkInput };
export {
  FRIEND_MARK_STATUSES,
  friendMarkInputSchema,
  friendMarkSchema,
  friendMarksResponseSchema,
};
