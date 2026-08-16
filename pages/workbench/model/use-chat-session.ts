import { useLiveQuery } from 'dexie-react-hooks';

import {
  chatSessionStore,
  friendMarkStore,
  jdStore,
} from '@/shared/infra/storage';
import type { ChatSession, RecordedJd } from '@/shared/zod';

// 当前会话档案聚合结果：会话 + 关联职位 + 失败标记
interface ChatSessionView {
  session: ChatSession; // 聊天页上报的最新会话档案
  jd?: RecordedJd; // 会话职位对应的已记录职位，未记录时缺省
  failed: boolean; // 是否带失败标记
}

// 工作台当前会话档案：最新会话 + 关联职位 + 失败标记，数据库变化自动刷新
const useChatSession = (): {
  view?: ChatSessionView;
  toggleFailed: () => Promise<void>;
} => {
  const view = useLiveQuery(async (): Promise<ChatSessionView | undefined> => {
    const session = await chatSessionStore.readLatestChatSession();
    if (session === undefined) {
      return undefined;
    }
    const [jd, marks] = await Promise.all([
      jdStore.readJdByJobId(session.encryptJobId),
      friendMarkStore.readAllFriendMarks(),
    ]);
    const failed = marks.some(
      (mark) =>
        mark.encryptBossId === session.encryptBossId &&
        mark.status === 'failed',
    );
    return { session, jd, failed };
  }, []);

  // 切换失败标记：已标记则清除，未标记则写入
  const toggleFailed = async (): Promise<void> => {
    if (view === undefined) {
      return;
    }
    await friendMarkStore.saveFriendMark({
      encryptBossId: view.session.encryptBossId,
      status: view.failed ? null : 'failed',
    });
  };

  return { view, toggleFailed };
};

export { useChatSession };
