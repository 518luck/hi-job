// # 会话列表同步（主世界）：拉取工作台写入的排除名单盖遮盖层，注入未沟通时长标签
import { debugLog } from '@/shared/lib/debug-log';
import { numberOf, stringOf } from '@/shared/lib/page-property';
import { excludedHrIdsResponseSchema } from '@/shared/zod';

import { extensionApi } from './background-rpc';
import { HIJOB_PREFIX } from './style';
import { friendOf, readFriendCount } from './vue-reader';

// 本地排除名单缓存：encryptBossId 集合，页面加载时从后台拉取
const excludedIds = new Set<string>();

// 上次日志记录的标记数：数量变化才打日志，避免轮询刷屏
let lastLoggedCount = -1;

// 注入会话总数标签：label-list 区域追加「共 N 位」；文本不变不写，避免触发自身观察者
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
  const next = `共 ${count} 位`;
  if (label.textContent !== next) {
    label.textContent = next;
  }
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

// 同步单个会话项：已排除盖「已 Pass」遮盖层，未排除移除；时间行注入未沟通时长
const syncItem = (item: HTMLElement): void => {
  const friend = friendOf(item);
  const bossId = friend === null ? '' : stringOf(friend, 'encryptBossId');
  const excluded = bossId !== '' && excludedIds.has(bossId);
  let mask = item.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-pass-mask`);
  if (excluded && mask === null) {
    mask = document.createElement('div');
    mask.className = `${HIJOB_PREFIX}-pass-mask`;
    mask.textContent = '已 Pass';
    item.append(mask);
  } else if (!excluded && mask !== null) {
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
    // 文本不变不写，避免自身的 DOM 写入触发页面观察者形成同步循环
    const next = sinceChatText(lastTS);
    if (label.textContent !== next) {
      label.textContent = next;
    }
  }
};

// 同步全部会话项：列表滚动加载后调用；识别不全时打日志便于排查
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
  if (identified !== total) {
    debugLog('会话列表同步', `${total} 项 / 识别 ${identified} 个`);
  }
};

// 从后台拉取排除名单并渲染
const loadExcludedHrs = async (): Promise<void> => {
  try {
    const response = await extensionApi.getExcludedHrIds();
    const parsed = excludedHrIdsResponseSchema.safeParse(response);
    if (parsed.success) {
      excludedIds.clear();
      for (const id of parsed.data) {
        excludedIds.add(id);
      }
    }
  } catch {
    // 后台不可达时保持空名单，不阻塞页面其他功能
  }
  if (excludedIds.size !== lastLoggedCount) {
    debugLog('拉取排除名单', `${excludedIds.size} 条`);
    lastLoggedCount = excludedIds.size;
  }
  syncAllItems();
};

export { loadExcludedHrs, syncAllItems, syncFriendCount };
