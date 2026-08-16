// # 聊天页辅助脚本（主世界）：会话总数、HR 失败标记、AI 生成回复
//
// 主世界才能安全读取页面 Vue 实例（__vue__）数据；主世界拿不到 chrome API，
// 扩展运行时消息经 postMessage 交给隔离世界脚本（runtime-bridge）转发后台。
import type { ReplyJd, ReplyMessage } from '@/shared/zod';
import {
  friendMarksResponseSchema,
  GENERATE_REPLY,
  GET_FRIEND_MARKS,
  SAVE_FRIEND_MARK,
} from '@/shared/zod';

// 桥请求/应答消息类型标识（与 runtime-bridge 配对）
const BRIDGE_REQUEST = 'hi-job:bridge-request';
const BRIDGE_RESPONSE = 'hi-job:bridge-response';

// 桥应答等待超时：后台生成回复可能较慢
const BRIDGE_TIMEOUT_MS = 30_000;

// 桥应答结构：成功携带 response，失败携带 error
interface BridgeResponsePayload {
  type: string;
  requestId: string;
  ok: boolean;
  response?: unknown;
  error?: string;
}

// 解析桥应答消息，结构不符返回 null
const parseBridgeResponse = (data: unknown): BridgeResponsePayload | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (
    record.type !== BRIDGE_RESPONSE ||
    typeof record.requestId !== 'string' ||
    typeof record.ok !== 'boolean'
  ) {
    return null;
  }
  return {
    type: BRIDGE_RESPONSE,
    requestId: record.requestId,
    ok: record.ok,
    response: record.response,
    error: typeof record.error === 'string' ? record.error : undefined,
  };
};

// 经隔离世界桥调用扩展运行时消息，返回后台应答
const sendRuntimeMessage = (message: unknown): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const onMessage = (event: MessageEvent) => {
      const payload = parseBridgeResponse(event.data);
      if (
        event.source !== window ||
        payload === null ||
        payload.requestId !== requestId
      ) {
        return;
      }
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      if (payload.ok) {
        resolve(payload.response);
      } else {
        reject(new Error(payload.error ?? '扩展调用失败'));
      }
    };
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('扩展桥响应超时'));
    }, BRIDGE_TIMEOUT_MS);
    window.addEventListener('message', onMessage);
    window.postMessage({ type: BRIDGE_REQUEST, requestId, message }, '*');
  });

// 聊天页根组件挂载点：探测确认 .main-wrap 持有 Chat 根实例
const VUE_ROOT_SELECTOR = '.main-wrap';

// 聊天记录 DOM 选择器：消息项与正文
const MESSAGE_ITEM_SELECTOR = '.chat-record .message-item';
const MESSAGE_CONTENT_SELECTOR = '.message-content';

// 已标记元素防重复注入的属性名
const HIJOB_PREFIX = 'hijob';

// 本地标记缓存：encryptBossId -> status，页面加载时从后台拉取
const marks = new Map<string, string>();

// 安全读取页面私有对象属性，避免 Vue 内部代理异常阻断读取
const readProperty = (source: unknown, key: string): unknown => {
  if (source === null || typeof source !== 'object') {
    return undefined;
  }
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
};

// 读取字符串属性，非字符串或读取失败回退空串
const stringOf = (source: unknown, key: string): string => {
  const value = readProperty(source, key);
  return typeof value === 'string' ? value.trim() : '';
};

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

// 从会话项元素的 Vue 实例提取会话对象（props/data 一层内找 encryptBossId）
const friendOf = (item: HTMLElement): Record<string, unknown> | null => {
  const instance = readProperty(item, '__vue__');
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
    const content = item.querySelector<HTMLElement>(MESSAGE_CONTENT_SELECTOR);
    const text = (content?.innerText ?? item.innerText).trim();
    if (text !== '') {
      messages.push({ role, text });
    }
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

// 注入页面样式：hover 显示标记按钮、badge 与辅助组件样式
const ensureStyle = (): void => {
  if (document.querySelector(`style[data-${HIJOB_PREFIX}-style]`) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.hijobStyle = '1';
  style.textContent = [
    `.friend-content .hijob-fail-btn{display:none;margin-left:6px;padding:1px 6px;border:1px solid #f5222d;border-radius:3px;color:#f5222d;font-size:11px;line-height:16px;background:#fff;cursor:pointer;vertical-align:middle;}`,
    `.friend-content:hover .hijob-fail-btn{display:inline-block;}`,
    `.friend-content .hijob-fail-badge{display:inline-block;margin-left:6px;padding:0 5px;border-radius:3px;background:#f5222d;color:#fff;font-size:11px;line-height:16px;vertical-align:middle;}`,
    `.hijob-friend-count{margin-left:8px;color:#999;font-size:12px;vertical-align:middle;}`,
    `.hijob-reply-box{margin:8px 12px 0;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;}`,
    `.hijob-reply-text{margin:6px 0;font-size:13px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-all;}`,
  ].join('\n');
  document.head.append(style);
};

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
  void sendRuntimeMessage({
    type: SAVE_FRIEND_MARK,
    encryptBossId,
    status: next,
  }).catch(() => {});
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
    const response = await sendRuntimeMessage({
      type: GET_FRIEND_MARKS,
    });
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

// 生成下一条回复：收集当前会话信息与聊天记录，经后台生成后展示
const handleGenerateReply = async (box: HTMLElement): Promise<void> => {
  const boss = readCurrentBoss();
  const textEl = box.querySelector<HTMLElement>(`.${HIJOB_PREFIX}-reply-text`);
  if (boss === null) {
    if (textEl !== null) {
      textEl.textContent = '未找到当前会话信息';
    }
    return;
  }
  if (textEl === null) {
    return;
  }
  const messages = readMessagesFromDom();
  if (messages.length === 0) {
    textEl.textContent = '暂无聊天记录';
    return;
  }
  textEl.textContent = '生成中…';
  try {
    const response = await sendRuntimeMessage({
      type: GENERATE_REPLY,
      jobId: stringOf(boss, 'encryptJobId'),
      jd: replyJdOf(boss),
      messages,
    });
    textEl.textContent = typeof response === 'string' ? response : '生成失败';
  } catch (error) {
    textEl.textContent =
      error instanceof Error ? `生成失败：${error.message}` : '生成失败';
  }
};

// 注入 AI 回复入口：聊天窗口消息区下方常驻按钮与结果卡
const ensureReplyBox = (): void => {
  const conversation = document.querySelector('.chat-conversation');
  if (conversation === null) {
    return;
  }
  let box = conversation.querySelector<HTMLElement>(
    `.${HIJOB_PREFIX}-reply-box`,
  );
  if (box !== null) {
    return;
  }
  box = document.createElement('div');
  box.className = `${HIJOB_PREFIX}-reply-box`;
  const button = document.createElement('button');
  button.textContent = 'AI 生成回复';
  button.style.cssText =
    'padding:4px 12px;border:1px solid #00c26d;border-radius:4px;background:#fff;color:#00c26d;font-size:12px;cursor:pointer;';
  button.addEventListener('click', () => {
    void handleGenerateReply(box as HTMLElement);
  });
  const text = document.createElement('div');
  text.className = `${HIJOB_PREFIX}-reply-text`;
  box.append(button, text);
  // 插到消息区之后、输入区之前
  const messageContent = conversation.querySelector('.message-content');
  if (messageContent !== null && messageContent.nextElementSibling !== null) {
    conversation.insertBefore(box, messageContent.nextElementSibling);
  } else {
    conversation.append(box);
  }
};

// 启动聊天页辅助：加载标记、注入组件，页面变化时防抖同步
const startChatHelper = (): void => {
  ensureStyle();
  ensureReplyBox();
  syncFriendCount();
  void loadMarks();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      syncFriendCount();
      syncAllItems();
      ensureReplyBox();
    }, 500);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export default defineContentScript({
  matches: ['*://*.zhipin.com/*'],
  world: 'MAIN',
  main() {
    // 仅聊天页注入
    if (
      !location.pathname.includes('/chat') &&
      document.querySelector('.chat-container') === null
    ) {
      return;
    }
    startChatHelper();
  },
});
