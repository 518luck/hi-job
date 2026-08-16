// # 会话失败标记（主世界）：标记缓存、会话列表注入与同步
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

// 切换会话标记：无标记 -> 失败，已标记 -> 清除
const toggleMark = async (encryptBossId: string): Promise<void> => {
  const next = marks.has(encryptBossId) ? null : 'failed';
  if (next === null) {
    marks.delete(encryptBossId);
  } else {
    marks.set(encryptBossId, next);
  }
  void extensionApi
    .saveFriendMark({ encryptBossId, status: next })
    .catch(() => {});
};

// 同步单个会话项：注入标记按钮与失败 badge
const syncItem = (item: HTMLElement): void => {
  const friend = friendOf(item);
  const bossId = friend === null ? '' : stringOf(friend, 'encryptBossId');
  const titleBox = item.querySelector('.title-box');
  if (titleBox === null) {
    return;
  }
  // 标记按钮：hover 显示，点击切换失败标记
  let button = titleBox.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-fail-btn`);
  if (button === null) {
    button = document.createElement('button');
    button.className = `${HIJOB_PREFIX}-fail-btn`;
    button.textContent = '失败';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (bossId !== '') {
        void toggleMark(bossId);
      }
    });
    titleBox.append(button);
  }
  // 失败 badge：有标记则展示，无标记移除
  let badge = titleBox.querySelector<HTMLElement>(
    `.${HIJOB_PREFIX}-fail-badge`,
  );
  const marked = bossId !== '' && marks.has(bossId);
  if (marked && badge === null) {
    badge = document.createElement('span');
    badge.className = `${HIJOB_PREFIX}-fail-badge`;
    badge.textContent = '失败';
    titleBox.append(badge);
  } else if (!marked && badge !== null) {
    badge.remove();
  }
};

// 同步全部会话项：列表滚动加载后调用
const syncAllItems = (): void => {
  for (const item of document.querySelectorAll<HTMLElement>(
    '.friend-content',
  )) {
    syncItem(item);
  }
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
  syncAllItems();
};

export { loadMarks, syncAllItems, syncFriendCount };
