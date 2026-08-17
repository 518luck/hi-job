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

// 距上次整批同步的最短间隔：消息滚动频繁，避免高频全量写库
const BATCH_SYNC_INTERVAL = 60_000;
let lastBatchSyncAt = 0;

// 同一会话消息采集的最短间隔：打字与滚动会触发防抖，无需每次重写
const MESSAGE_SYNC_INTERVAL = 10_000;
let lastMessageSync: { bossId: string; at: number } | null = null;

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

// 整批同步全部 HR：读页面左侧联系列表批量上报，节流执行
const syncAllHrs = (): void => {
  const now = Date.now();
  if (now - lastBatchSyncAt < BATCH_SYNC_INTERVAL) {
    return;
  }
  const inputs = readAllFriends()
    .map(toHrInput)
    .filter((input): input is HrInput => input !== null);
  if (inputs.length === 0) {
    return;
  }
  lastBatchSyncAt = now;
  void extensionApi.syncHrs(inputs).catch(() => {});
};

// 同步当前会话聊天消息：读消息窗 DOM 落库，同一会话节流
const syncChatMessages = (): void => {
  const boss = readCurrentBoss();
  const bossId = boss === null ? '' : stringOf(boss, 'encryptBossId');
  if (boss === null || bossId === '') {
    return;
  }
  const now = Date.now();
  if (
    lastMessageSync !== null &&
    lastMessageSync.bossId === bossId &&
    now - lastMessageSync.at < MESSAGE_SYNC_INTERVAL
  ) {
    return;
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
