// # 会话档案上报（主世界）：当前会话的 HR 信息与最后一条消息上报后台
import { debugLog } from '@/shared/lib/debug-log';
import { booleanOf, numberOf, stringOf } from '@/shared/lib/page-property';

import { extensionApi } from './background-rpc';
import { readCurrentBoss } from './vue-reader';

// 最近上报过的会话 id：会话切换时才上报，避免消息滚动触发高频写入
let lastReportedBossId = '';

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

// 同步当前会话档案：上报当前 boss 的会话信息，沟通时间由后台盖章
const syncChatSession = (): void => {
  const boss = readCurrentBoss();
  const bossId = boss === null ? '' : stringOf(boss, 'encryptBossId');
  if (boss === null || bossId === '' || bossId === lastReportedBossId) {
    return;
  }
  lastReportedBossId = bossId;
  const bossName = firstStringOf(boss, ['name', 'bossName']);
  const bossTitle = firstStringOf(boss, ['title', 'bossTitle']);
  debugLog('上报会话档案', `${bossName} / ${bossTitle}`, bossId);
  void extensionApi
    .saveChatSession({
      encryptBossId: bossId,
      encryptJobId: stringOf(boss, 'encryptJobId'),
      bossName,
      bossTitle,
      brandName: stringOf(boss, 'brandName'),
      lastText: stringOf(boss, 'lastText'),
      lastMsgAt: numberOf(boss, 'lastTS'),
      lastIsSelf: booleanOf(boss, 'lastIsSelf'),
    })
    .catch(() => {});
};

export { syncChatSession };
