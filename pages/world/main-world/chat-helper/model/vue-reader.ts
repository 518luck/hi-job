// # 聊天页数据读取（主世界）：Vue 实例与 DOM 中的会话、消息数据
import { numberOf, readProperty, stringOf } from '@/shared/lib/page-property';
import type {
  ChatMessageInput,
  HrInfo,
  ReplyJd,
  ReplyMessage,
} from '@/shared/zod';

// 聊天页根组件挂载点：探测确认 .main-wrap 持有 Chat 根实例
const VUE_ROOT_SELECTOR = '.main-wrap';

// 聊天记录 DOM 选择器：消息项在 .chat-message > .im-list 内，仍为 .message-item
const MESSAGE_ITEM_SELECTOR = '.chat-record .message-item';
const MESSAGE_CONTENT_SELECTOR = '.message-content';

// 在组件树中按组件名查找实例，返回第一个匹配（限制深度）
const findInstanceByName = (
  instance: unknown,
  targetName: string,
  depth: number,
): unknown => {
  if (depth > 6 || instance === null || typeof instance !== 'object') {
    return undefined;
  }
  const options = readProperty(instance, '$options');
  const name =
    typeof options === 'object' && options !== null
      ? readProperty(options, 'name')
      : undefined;
  if (name === targetName) {
    return instance;
  }
  const children = readProperty(instance, '$children');
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findInstanceByName(child, targetName, depth + 1);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
};

// 读取聊天页 Vue 根实例
const readVueRoot = (): unknown =>
  readProperty(document.querySelector(VUE_ROOT_SELECTOR), '__vue__');

// 读取全部联系人列表：boss-list-label 组件的 friends 数组，含未点开过的会话
const readAllFriends = (): Record<string, unknown>[] => {
  const root = readVueRoot();
  if (root === undefined) {
    return [];
  }
  const labelInstance = findInstanceByName(root, 'boss-list-label', 0);
  if (labelInstance === undefined) {
    return [];
  }
  const friends = readProperty(readProperty(labelInstance, '$data'), 'friends');
  return Array.isArray(friends) ? (friends as Record<string, unknown>[]) : [];
};

// 读取会话总数：全部联系人数组长度
const readFriendCount = (): number => readAllFriends().length;

// 读取当前会话信息：message-list 组件的 boss 对象
const readCurrentBoss = (): Record<string, unknown> | null => {
  const root = readVueRoot();
  if (root === undefined) {
    return null;
  }
  const msgInstance = findInstanceByName(root, 'message-list', 0);
  if (msgInstance === undefined) {
    return null;
  }
  const boss = readProperty(readProperty(msgInstance, '$data'), 'boss');
  if (boss === null || typeof boss !== 'object') {
    return null;
  }
  return boss as Record<string, unknown>;
};

// 带重试的当前会话读取：SPA 切换后 Vue 树异步重建，短窗口内可能为空
const readCurrentBossWithRetry = async (): Promise<Record<
  string,
  unknown
> | null> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const boss = readCurrentBoss();
    if (boss !== null) {
      return boss;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
};

// 从元素沿祖先找最近的 Vue 实例：__vue__ 只挂在组件根元素上，限制层数防爬到列表级组件
const vueOfElement = (el: HTMLElement): unknown => {
  for (
    let node: HTMLElement | null = el, depth = 0;
    node !== null && depth < 3;
    node = node.parentElement, depth += 1
  ) {
    const vue = readProperty(node, '__vue__');
    if (vue !== undefined) {
      return vue;
    }
  }
  return undefined;
};

// 从会话项元素提取会话对象：沿祖先找 Vue 实例，props/data 一层内找 encryptBossId
const friendOf = (item: HTMLElement): Record<string, unknown> | null => {
  const instance = vueOfElement(item);
  if (instance === undefined) {
    return null;
  }
  for (const source of [
    readProperty(instance, '$props'),
    readProperty(instance, '$data'),
  ]) {
    if (source === null || typeof source !== 'object') {
      continue;
    }
    if (typeof readProperty(source, 'encryptBossId') === 'string') {
      return source as Record<string, unknown>;
    }
    for (const key of Object.keys(source)) {
      const value = readProperty(source, key);
      if (
        value !== null &&
        typeof value === 'object' &&
        typeof readProperty(value, 'encryptBossId') === 'string'
      ) {
        return value as Record<string, unknown>;
      }
    }
  }
  return null;
};

// 竞争者 PK 卡片特征文本：页面组件混入消息区时需剔除，防止污染聊天记录
const isPkCardText = (text: string): boolean =>
  text.includes('竞争者PK') || text.includes('查看详细分析');

// 消息状态词：抓取文本时剔除单独成行的状态标记（送达/已读/未读）
const MESSAGE_STATUS_WORDS = ['送达', '已读', '未读'];

// 清理消息文本：去空白行与状态词行
const cleanMessageText = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !MESSAGE_STATUS_WORDS.includes(line))
    .join('\n');

// 从 DOM 提取聊天记录：含 item-friend 的为招聘者，其余消息项按自己处理，取最近 100 条
const readMessagesFromDom = (): ReplyMessage[] => {
  const messages: ReplyMessage[] = [];
  for (const item of document.querySelectorAll<HTMLElement>(
    MESSAGE_ITEM_SELECTOR,
  )) {
    // 优先取消息正文容器文本；容器缺失时回退消息项全文本后清理状态词
    const content = item.querySelector<HTMLElement>(MESSAGE_CONTENT_SELECTOR);
    const text = cleanMessageText(
      (content?.innerText ?? item.innerText).trim(),
    );
    if (text === '' || isPkCardText(text)) {
      continue;
    }
    // 消息只有自己/招聘者两方：非 item-friend 即自己（页面已无 item-self 标记）
    const role = item.classList.contains('item-friend') ? 'friend' : 'self';
    messages.push({ role, text });
  }
  return messages.slice(-100);
};

// 从消息项沿祖先的 Vue 实例读取消息元信息：优先真实 id 与时间戳（页面私有字段逐层尝试）
const messageMetaOf = (
  item: HTMLElement,
):
  | {
      msgId?: string;
      ts?: number;
    }
  | undefined => {
  const instance = vueOfElement(item);
  if (instance === undefined) {
    return undefined;
  }
  for (const source of [
    readProperty(instance, '$props'),
    readProperty(instance, '$data'),
  ]) {
    if (source === null || typeof source !== 'object') {
      continue;
    }
    const msgId =
      stringOf(source, 'msgId') || stringOf(source, 'msgid');
    const ts =
      numberOf(source, 'lastTS') || numberOf(source, 'ts');
    if (msgId !== '' || ts > 0) {
      return {
        msgId: msgId === '' ? undefined : msgId,
        ts: ts > 0 ? ts : undefined,
      };
    }
    // 消息字段可能包在实例数据内层对象里，遍历一层查找
    for (const key of Object.keys(source)) {
      const value = readProperty(source, key);
      if (value === null || typeof value !== 'object') {
        continue;
      }
      const nestedId = stringOf(value, 'msgId') || stringOf(value, 'id');
      const nestedTs = numberOf(value, 'lastTS') || numberOf(value, 'ts');
      if (nestedId !== '' || nestedTs > 0) {
        return {
          msgId: nestedId === '' ? undefined : nestedId,
          ts: nestedTs > 0 ? nestedTs : undefined,
        };
      }
    }
  }
  return undefined;
};

// 消息 id 提取：DOM 属性优先（data-mid 为页面真实消息 id），其次元素 Vue 元信息，最后回退哨兵
const messageIdOf = (
  item: HTMLElement,
  role: 'self' | 'friend',
  text: string,
): string => {
  const domId =
    item.getAttribute('data-mid') ??
    item.getAttribute('data-msgid') ??
    item.getAttribute('data-id') ??
    item.id;
  if (domId !== '') {
    return domId;
  }
  return messageMetaOf(item)?.msgId ?? `${role}:${text}`;
};

// 消息时间提取：data-ts 属性优先，其次元素 Vue 元信息，再解析时间文本，无法识别回退 0
const parseMessageTime = (item: HTMLElement): number => {
  const timeEl = item.querySelector<HTMLElement>('.time');
  const rawTs = timeEl?.dataset.ts;
  if (rawTs !== undefined && !Number.isNaN(Number(rawTs))) {
    return Number(rawTs);
  }
  const metaTs = messageMetaOf(item)?.ts;
  if (metaTs !== undefined) {
    return metaTs;
  }
  const text = timeEl?.textContent ?? '';
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch !== null) {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(timeMatch[1]),
      Number(timeMatch[2]),
    ).getTime();
  }
  if (text.includes('昨天')) {
    return Date.now() - 24 * 60 * 60_000;
  }
  const dateMatch = text.match(/(\d{1,2})[月/](\d{1,2})/);
  if (dateMatch !== null) {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      Number(dateMatch[1]) - 1,
      Number(dateMatch[2]),
    ).getTime();
  }
  return 0;
};

// 读取聊天窗消息流水：文本、发出方、消息 id 与时间，encryptBossId 由调用方补齐
const readChatMessages = (): ChatMessageInput[] => {
  const messages: ChatMessageInput[] = [];
  for (const item of document.querySelectorAll<HTMLElement>(
    MESSAGE_ITEM_SELECTOR,
  )) {
    const content = item.querySelector<HTMLElement>(MESSAGE_CONTENT_SELECTOR);
    const text = cleanMessageText(
      (content?.innerText ?? item.innerText).trim(),
    );
    if (text === '' || isPkCardText(text)) {
      continue;
    }
    // 消息只有自己/招聘者两方：非 item-friend 即自己（页面已无 item-self 标记）
    const role = item.classList.contains('item-friend') ? 'friend' : 'self';
    messages.push({
      encryptBossId: '',
      msgId: messageIdOf(item, role, text),
      role,
      text,
      msgAt: parseMessageTime(item),
    });
  }
  return messages;
};

// 带重试的聊天记录读取：消息异步渲染，短窗口内 DOM 可能为空
const readMessagesWithRetry = async (): Promise<ReplyMessage[]> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const messages = readMessagesFromDom();
    if (messages.length > 0) {
      return messages;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return [];
};

// 由当前会话信息拼回复生成的最小职位信息
const replyJdOf = (boss: Record<string, unknown>): ReplyJd => ({
  title: stringOf(boss, 'jobName') || stringOf(boss, 'positionName'),
  companyName: stringOf(boss, 'brandName'),
  companyScale: '',
  companyIndustry: '',
  salary: '',
  description: '',
});

// 由当前会话信息提取 HR 信息：姓名/头衔取别名，读不到时返回 undefined
const hrOf = (boss: Record<string, unknown>): HrInfo | undefined => {
  const bossName = stringOf(boss, 'name') || stringOf(boss, 'bossName');
  const bossTitle = stringOf(boss, 'title') || stringOf(boss, 'bossTitle');
  const brandName = stringOf(boss, 'brandName');
  if (bossName === '' && brandName === '') {
    return undefined;
  }
  return { bossName, bossTitle, brandName };
};

export {
  friendOf,
  hrOf,
  readAllFriends,
  readChatMessages,
  readCurrentBoss,
  readCurrentBossWithRetry,
  readFriendCount,
  readMessagesFromDom,
  readMessagesWithRetry,
  replyJdOf,
};
