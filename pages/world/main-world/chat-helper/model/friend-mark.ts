// # 会话标记同步（主世界）：拉取工作台写入的标记，为已标记会话盖遮盖层
import { debugLog } from '@/shared/lib/debug-log';
import { stringOf } from '@/shared/lib/page-property';
import { friendMarksResponseSchema } from '@/shared/zod';

import { extensionApi } from './background-rpc';
import { HIJOB_PREFIX } from './style';
import { friendOf, readFriendCount } from './vue-reader';

// 本地标记缓存：encryptBossId -> status，页面加载时从后台拉取
const marks = new Map<string, string>();

// 注入会话总数标签：label-list 区域追加「共 N 位」
const syncFriendCount = (): void => {
  const count = readFriendCount();
  const list = document.querySelector('.label-list ul');
  if (list === null || count === 0) {
    return;
  }
  let label = list.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-friend-count`);
  if (label === null) {
    label = document.createElement('span');
    label.className = `${HIJOB_PREFIX}-friend-count`;
    list.append(label);
  }
  label.textContent = `共 ${count} 位`;
};

// 同步单个会话项：已标记的会话盖「已 Pass」遮盖层，未标记则移除
const syncItem = (item: HTMLElement): void => {
  const friend = friendOf(item);
  const bossId = friend === null ? '' : stringOf(friend, 'encryptBossId');
  const marked = bossId !== '' && marks.has(bossId);
  let mask = item.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-pass-mask`);
  if (marked && mask === null) {
    mask = document.createElement('div');
    mask.className = `${HIJOB_PREFIX}-pass-mask`;
    mask.textContent = '已 Pass';
    item.append(mask);
  } else if (!marked && mask !== null) {
    mask.remove();
  }
};

// 同步全部会话项：列表滚动加载后调用，附识别计数便于排查
const syncAllItems = (): void => {
  let total = 0;
  let identified = 0;
  for (const item of document.querySelectorAll<HTMLElement>(
    '.friend-content',
  )) {
    total += 1;
    if (friendOf(item) !== null) {
      identified += 1;
    }
    syncItem(item);
  }
  debugLog('会话列表同步', `${total} 项 / 识别 ${identified} 个`);
};

// 从后台拉取全部标记并渲染
const loadMarks = async (): Promise<void> => {
  try {
    const response = await extensionApi.getFriendMarks();
    const parsed = friendMarksResponseSchema.safeParse(response);
    if (parsed.success) {
      marks.clear();
      for (const mark of parsed.data) {
        marks.set(mark.encryptBossId, mark.status);
      }
    }
  } catch {
    // 后台不可达时保持空标记，不阻塞页面其他功能
  }
  debugLog('拉取标记', `${marks.size} 条`);
  syncAllItems();
};

export { loadMarks, syncAllItems, syncFriendCount };
