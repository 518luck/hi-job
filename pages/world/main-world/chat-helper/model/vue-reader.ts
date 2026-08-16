// # 聊天页数据读取（主世界）：Vue 实例与 DOM 中的会话、消息数据
import { readProperty, stringOf } from '@/shared/lib/page-property';
import type { HrInfo, ReplyJd, ReplyMessage } from '@/shared/zod';

// 聊天页根组件挂载点：探测确认 .main-wrap 持有 Chat 根实例
const VUE_ROOT_SELECTOR = '.main-wrap';

// 聊天记录 DOM 选择器：消息项与正文
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

// 读取会话总数：boss-list-label 组件的 friends 数组长度
const readFriendCount = (): number => {
  const root = readVueRoot();
  if (root === undefined) {
    return 0;
  }
  const labelInstance = findInstanceByName(root, 'boss-list-label', 0);
  if (labelInstance === undefined) {
    return 0;
  }
  const friends = readProperty(readProperty(labelInstance, '$data'), 'friends');
  return Array.isArray(friends) ? friends.length : 0;
};

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

// 从 DOM 提取聊天记录：item-friend 为招聘者，item-self 为求职者，取最近 30 条
const readMessagesFromDom = (): ReplyMessage[] => {
  const messages: ReplyMessage[] = [];
  for (const item of document.querySelectorAll<HTMLElement>(
    MESSAGE_ITEM_SELECTOR,
  )) {
    const role = item.classList.contains('item-friend')
      ? 'friend'
      : item.classList.contains('item-self')
        ? 'self'
        : null;
    if (role === null) {
      continue;
    }
    // 只取消息正文容器文本：匹配不到说明该元素是页面组件（如竞争者 PK 卡片），跳过
    const content = item.querySelector<HTMLElement>(MESSAGE_CONTENT_SELECTOR);
    if (content === null) {
      continue;
    }
    const text = content.innerText.trim();
    if (text === '' || isPkCardText(text)) {
      continue;
    }
    messages.push({ role, text });
  }
  return messages.slice(-30);
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
  readCurrentBoss,
  readFriendCount,
  readMessagesFromDom,
  replyJdOf,
};
