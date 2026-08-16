// # chat-session 领域仓储：聊天会话档案的统一读写入口
import type { ChatSession, ChatSessionInput } from '@/shared/zod';

import { db } from '../db';

// 上报会话：盖章最近沟通时间后落库，同一会话重复上报即刷新
const saveChatSession = async (input: ChatSessionInput): Promise<void> => {
  await db.chatSession.put({ ...input, lastChatAt: Date.now() });
};

// 读取最近一条会话档案：工作台展示当前沟通的 HR
const readLatestChatSession = (): Promise<ChatSession | undefined> =>
  db.chatSession.orderBy('lastChatAt').last();

// chat-session 领域仓储：会话档案的写入与最近会话读取
const chatSessionStore = {
  saveChatSession, // 上报会话
  readLatestChatSession, // 读取最近会话
};

export { chatSessionStore };
