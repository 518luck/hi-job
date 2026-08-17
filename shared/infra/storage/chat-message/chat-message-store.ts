// # chat-message 领域仓储：聊天消息的统一读写入口
import type { ChatMessage, ChatMessageInput } from '@/shared/zod';

import { db } from '../db';

// 批量保存消息：按 (会话, 消息 id) 幂等写入，重复采集不重存
const saveChatMessages = async (inputs: ChatMessageInput[]): Promise<void> => {
  if (inputs.length === 0) {
    return;
  }
  await db.chatMessage.bulkPut(inputs);
};

// 读取某 HR 的聊天消息：按消息时间正序，供会话复盘使用
const readChatMessagesOf = async (
  encryptBossId: string,
): Promise<ChatMessage[]> =>
  db.chatMessage.where('encryptBossId').equals(encryptBossId).sortBy('msgAt');

// chat-message 领域仓储：消息流水写入与读取
const chatMessageStore = {
  saveChatMessages, // 批量保存消息
  readChatMessagesOf, // 读取某 HR 的消息
};

export { chatMessageStore };
