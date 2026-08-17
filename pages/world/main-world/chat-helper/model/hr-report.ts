// # HR 档案与聊天消息上报（主世界）：当前 HR、全量列表与消息流水
import { debugLog } from '@/shared/lib/debug-log';
import { booleanOf, numberOf, stringOf } from '@/shared/lib/page-property';
import type { ChatMessageInput, HrInput } from '@/shared/zod';

import { extensionApi } from './background-rpc';
import {
  readAllFriends,
  readChatMessages,
  readCurrentBoss,
} from './vue-reader';

// 最近上报过的会话 id：会话切换时才上报，避免消息滚动触发高频写入
let lastReportedBossId = '';

// 联系人列表签名：长度 + 末位联系人 id，变化时才触发批量同步
let lastFriendSignature = '';

// 同一会话消息采集的最短间隔：打字与滚动会触发防抖，无需每次重写
const MESSAGE_SYNC_INTERVAL = 10_000;
let lastMessageSync: { bossId: string; at: number } | null = null;

// 历史加载最多轮数：会话极长时终止循环，防止死等
const MAX_HISTORY_ROUNDS = 12;

// 消息项选择器：统计已渲染消息数，判断历史加载是否还有新增
const MESSAGE_ITEM_COUNT_SELECTOR = '.chat-record .message-item';

// 短等待：滚动加载历史时给页面渲染留时间
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 查找承载消息列表的滚动容器：沿 .chat-record 祖先找首个有滚动溢出的元素
const findChatScroller = (): HTMLElement | null => {
  const record = document.querySelector<HTMLElement>('.chat-record');
  for (
    let node: HTMLElement | null = record;
    node !== null;
    node = node.parentElement
  ) {
    if (node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return null;
};

// 向上滚动加载更早消息：反复滚到顶等待新消息渲染，直到数量不再增长
const loadChatHistory = async (scroller: HTMLElement): Promise<void> => {
  for (let round = 0; round < MAX_HISTORY_ROUNDS; round += 1) {
    const before = document.querySelectorAll(MESSAGE_ITEM_COUNT_SELECTOR)
      .length;
    scroller.scrollTop = 0;
    await sleep(500);
    const after = document.querySelectorAll(MESSAGE_ITEM_COUNT_SELECTOR).length;
    if (after <= before) {
      return;
    }
  }
};

// 读取 boss 字段的第一个非空字符串候选值：页面数据字段名随版本可能变化
const firstStringOf = (
  source: Record<string, unknown>,
  keys: readonly string[],
): string => {
  for (const key of keys) {
    const value = stringOf(source, key);
    if (value !== '') {
      return value;
    }
  }
  return '';
};

// 上报当前 HR：切换会话时刷新档案，最近打开时间由后台盖章
const syncHrReport = (): void => {
  const boss = readCurrentBoss();
  const bossId = boss === null ? '' : stringOf(boss, 'encryptBossId');
  if (boss === null || bossId === '' || bossId === lastReportedBossId) {
    return;
  }
  lastReportedBossId = bossId;
  const bossName = firstStringOf(boss, ['name', 'bossName']);
  const bossTitle = firstStringOf(boss, ['title', 'bossTitle']);
  debugLog('上报 HR 档案', `${bossName} / ${bossTitle}`, bossId);
  void extensionApi
    .saveHr({
      encryptBossId: bossId,
      encryptJobId: stringOf(boss, 'encryptJobId'),
      bossName,
      bossTitle,
      brandName: stringOf(boss, 'brandName'),
      avatar: stringOf(boss, 'avatar'),
      city: stringOf(boss, 'locationName'),
      lastText: stringOf(boss, 'lastText'),
      lastMsgAt: numberOf(boss, 'lastTS'),
      lastIsSelf: booleanOf(boss, 'lastIsSelf'),
    })
    .catch(() => {});
};

// 由列表联系人对象映射为 HR 上报输入；缺 id 的联系人无法入库，剔除
const toHrInput = (friend: Record<string, unknown>): HrInput | null => {
  const encryptBossId = stringOf(friend, 'encryptBossId');
  if (encryptBossId === '') {
    return null;
  }
  return {
    encryptBossId,
    encryptJobId: stringOf(friend, 'encryptJobId'),
    bossName: firstStringOf(friend, ['name', 'bossName']),
    bossTitle: firstStringOf(friend, ['title', 'bossTitle']),
    brandName: stringOf(friend, 'brandName'),
    avatar: stringOf(friend, 'avatar'),
    city: stringOf(friend, 'locationName'),
    lastText: stringOf(friend, 'lastText'),
    lastMsgAt: numberOf(friend, 'lastTS'),
    lastIsSelf: booleanOf(friend, 'lastIsSelf'),
  };
};

// 整批同步全部 HR：列表数据变化（用户滚动触发分页加载）时增量上报，数据未变不写库
const syncAllHrs = (): void => {
  const friends = readAllFriends();
  const last = friends[friends.length - 1];
  const signature = `${friends.length}:${last?.encryptBossId ?? ''}`;
  if (signature === lastFriendSignature) {
    return;
  }
  lastFriendSignature = signature;
  const inputs = friends
    .map(toHrInput)
    .filter((input): input is HrInput => input !== null);
  if (inputs.length === 0) {
    return;
  }
  void extensionApi.syncHrs(inputs).catch(() => {});
};

// 同步当前会话聊天消息：首次进入先滚顶加载历史再抓全量，同一会话节流
const syncChatMessages = async (): Promise<void> => {
  const boss = readCurrentBoss();
  const bossId = boss === null ? '' : stringOf(boss, 'encryptBossId');
  if (boss === null || bossId === '') {
    return;
  }
  const now = Date.now();
  const entering =
    lastMessageSync === null || lastMessageSync.bossId !== bossId;
  if (
    !entering &&
    lastMessageSync !== null &&
    now - lastMessageSync.at < MESSAGE_SYNC_INTERVAL
  ) {
    return;
  }
  // 首次进入该会话：滚顶加载更早消息后恢复原滚动位置，再抓全量
  if (entering) {
    const scroller = findChatScroller();
    if (scroller !== null) {
      const restoreTop = scroller.scrollTop;
      await loadChatHistory(scroller);
      scroller.scrollTop = restoreTop;
    }
  }
  const messages = readChatMessages().map(
    (message): ChatMessageInput => ({
      ...message,
      encryptBossId: bossId,
    }),
  );
  if (messages.length === 0) {
    return;
  }
  lastMessageSync = { bossId, at: now };
  void extensionApi.saveChatMessages(messages).catch(() => {});
};

export { syncAllHrs, syncChatMessages, syncHrReport };
