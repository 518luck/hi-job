// # friend-mark 领域仓储：HR 会话标记的统一读写入口
import type { FriendMark } from '@/shared/zod';

import { db } from '../db';

// 保存或清除一条标记：status 为 null 时删除该会话的标记
const saveFriendMark = async ({
  encryptBossId,
  status,
}: {
  encryptBossId: string; // 目标 HR 会话 id
  status: FriendMark['status'] | null; // 标记状态，null 清除
}): Promise<void> => {
  if (status === null) {
    await db.friendMark.delete(encryptBossId);
    return;
  }
  await db.friendMark.put({
    encryptBossId,
    status,
    updatedAt: Date.now(),
  });
};

// 读取全部标记，供聊天页初始化渲染
const readAllFriendMarks = (): Promise<FriendMark[]> => db.friendMark.toArray();

// friend-mark 领域仓储：HR 会话标记的统一读写入口
const friendMarkStore = {
  saveFriendMark, // 保存或清除一条标记
  readAllFriendMarks, // 读取全部标记
};

export { friendMarkStore };
