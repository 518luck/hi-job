// # chat-message 表数据字典：与 HR 的逐条聊天消息
import { z } from 'zod';

// 表 chatMessage（聊天消息流水）落库实体：复合主键 encryptBossId + msgId
const chatMessageSchema = z.object({
  encryptBossId: z.string(), // 所属 HR 会话 id，与 hr 表关联
  msgId: z.string(), // 消息唯一 id，取自页面消息元信息，读不到回退哨兵值
  role: z.enum(['self', 'friend']), // 消息发出方：self 自己，friend HR
  text: z.string(), // 消息文本
  msgAt: z.number(), // 消息时间戳（毫秒），读不到为 0
});

// 采集输入与落库实体字段一致
const chatMessageInputSchema = chatMessageSchema;

// 从 schema 派生类型，保持单一事实来源
type ChatMessage = z.infer<typeof chatMessageSchema>;
type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;

export type { ChatMessage, ChatMessageInput };
export { chatMessageInputSchema, chatMessageSchema };
