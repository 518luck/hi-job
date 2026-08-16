// # 会话列表同步（主世界）：拉取工作台写入的标记盖遮盖层，注入未沟通时长标签
import { debugLog } from '@/shared/lib/debug-log';
import { numberOf, stringOf } from '@/shared/lib/page-property';
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

// 距上次沟通的时长文案：刚刚 / N 分钟 / N 小时 / N 天
const sinceChatText = (lastTS: number): string => {
  const minutes = Math.floor((Date.now() - lastTS) / 60_000);
  if (minutes < 1) {
    return '刚刚沟通';
  }
  if (minutes < 60) {
    return `${minutes} 分钟未沟通`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时未沟通`;
  }
  return `${Math.floor(hours / 24)} 天未沟通`;
};

// 同步单个会话项：已标记盖「已 Pass」遮盖层，未标记移除；时间行注入未沟通时长
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
  const timeRow = item.querySelector('.time')?.parentElement ?? null;
  const lastTS =
    friend === null
      ? 0
      : numberOf(friend, 'lastTS') || numberOf(friend, 'updateTime');
  if (timeRow !== null && lastTS > 0) {
    let label = timeRow.querySelector<HTMLElement>(
      `.${HIJOB_PREFIX}-since-chat`,
    );
    if (label === null) {
      label = document.createElement('span');
      label.className = `${HIJOB_PREFIX}-since-chat`;
      timeRow.append(label);
    }
    label.textContent = sinceChatText(lastTS);
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
