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

// 读取全部聊天消息：导出备份用，数据量大时慎用
const readAllChatMessages = (): Promise<ChatMessage[]> =>
  db.chatMessage.toArray();

// 统计全部聊天消息条数：清空确认文案展示用
const countAllChatMessages = (): Promise<number> =>
  db.chatMessage.count();

// 清空全部聊天消息：清除数据库时一并清理
const clearAllChatMessages = (): Promise<void> => db.chatMessage.clear();

// chat-message 领域仓储：消息流水写入、读取与清空
const chatMessageStore = {
  saveChatMessages, // 批量保存消息
  readChatMessagesOf, // 读取某 HR 的消息
  readAllChatMessages, // 读取全部消息
  countAllChatMessages, // 统计全部消息条数
  clearAllChatMessages, // 清空全部消息
};

export { chatMessageStore };
