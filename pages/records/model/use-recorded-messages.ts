import { useLiveQuery } from 'dexie-react-hooks';

import { chatMessageStore } from '@/shared/infra/storage';

// 记录页聊天消息总数：数据库变化时自动重新查询
const useRecordedMessages = (): {
  messagesCount: number;
  loading: boolean;
} => {
  const count = useLiveQuery(() => chatMessageStore.countAllChatMessages(), []);

  return {
    messagesCount: count ?? 0,
    loading: count === undefined,
  };
};

export { useRecordedMessages };
