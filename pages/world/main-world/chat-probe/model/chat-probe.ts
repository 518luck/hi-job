// # 聊天页数据探测（主世界，临时工具）：注入 test 按钮，dump 聊天页 Vue 数据
//
// 目标：确认聊天页 Vue 实例的挂载点与会话/消息数据结构，为 HR badge 与 AI 问答功能定字段。
import {
  WINDOW_NOTIFY_DEBUG_SETTINGS_CHANGED,
  WINDOW_NOTIFY_NAMESPACE,
} from '@/pages/world/rpc';
import { readDebugLogs } from '@/shared/lib/debug-log';
import { readProperty } from '@/shared/lib/page-property';

import { extensionApi } from './background-rpc';

// 候选 Vue 挂载点：按优先级逐个探测
const MOUNT_CANDIDATES = [
  '#app',
  '.main-wrap',
  '#main',
  '#container',
  '.chat-container',
];

// 面板元素标记，防重复注入
const PROBE_BUTTON_FLAG = 'data-hijob-probe';
const PROBE_PANEL_FLAG = 'data-hijob-probe-panel';

// 把任意值压成可读摘要：字符串截断、数组记长度、对象标类型
const briefOf = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `array[${value.length}]`;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  return 'undefined';
};

// 提取对象的一层字段概览：字段名 -> 摘要
const fieldsOf = (obj: unknown): Record<string, string> => {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }
  const out: Record<string, string> = {};
  for (const key of Object.keys(obj).slice(0, 40)) {
    out[key] = briefOf(readProperty(obj, key));
  }
  return out;
};

// 任意值的结构摘要：区分原始类型/数组/对象，带字段名与 JSON 片段
const shapeOf = (value: unknown): unknown => {
  if (value === null) {
    return 'null';
  }
  if (typeof value !== 'object') {
    return typeof value;
  }
  if (Array.isArray(value)) {
    return { kind: 'array', length: value.length };
  }
  const keys = Object.keys(value).slice(0, 10);
  let sample = '';
  try {
    sample = JSON.stringify(value).slice(0, 200);
  } catch {
    sample = '(JSON 序列化失败)';
  }
  return { kind: 'object', keys, sample };
};

// 单个实例的组件名：$options.name 优先，回退 $vnode.tag
const componentNameOf = (instance: unknown): string => {
  const options = readProperty(instance, '$options');
  const name =
    typeof options === 'object' && options !== null
      ? readProperty(options, 'name')
      : undefined;
  if (typeof name === 'string' && name !== '') {
    return name;
  }
  const tag = readProperty(readProperty(instance, '$vnode'), 'tag');
  return typeof tag === 'string' ? tag : '';
};

// 单个实例的数据概览：组件名 + $data/setupState 字段概览
interface InstanceOverview {
  name: string;
  dataKeys: Record<string, string>;
  setupKeys: Record<string, string>;
}

const instanceOverview = (instance: unknown): InstanceOverview => ({
  name: componentNameOf(instance),
  dataKeys: fieldsOf(readProperty(instance, '$data')),
  setupKeys: fieldsOf(readProperty(instance, 'setupState')),
});

// 递归收集实例树中有数据的实例（Vue2 $children 遍历，限制深度）
const collectDataInstances = (
  instance: unknown,
  depth: number,
  out: Record<string, unknown>[],
): void => {
  if (depth > 4 || instance === null || typeof instance !== 'object') {
    return;
  }
  const overview = instanceOverview(instance);
  const hasData =
    Object.keys(overview.dataKeys).length > 0 ||
    Object.keys(overview.setupKeys).length > 0;
  if (hasData) {
    out.push({ depth, ...overview });
  }
  const children = readProperty(instance, '$children');
  if (Array.isArray(children)) {
    for (const child of children) {
      collectDataInstances(child, depth + 1, out);
    }
  }
};

// 在组件树中按组件名查找实例，返回第一个匹配（限制深度）
const findInstanceByName = (
  instance: unknown,
  targetName: string,
  depth: number,
): unknown => {
  if (depth > 5 || instance === null || typeof instance !== 'object') {
    return undefined;
  }
  if (componentNameOf(instance) === targetName) {
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

// 探测聊天页消息 DOM 结构：消息区容器、消息项数量、最近消息文本的归属元素与祖先链
const probeMessageDom = (lastText: string): Record<string, unknown> => {
  const chatRecord = document.querySelector('.chat-record');
  const firstMessage = document.querySelector('.chat-record .chat-message');
  const ownerOf = (text: string): unknown => {
    if (text === '') {
      return null;
    }
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('.chat-record *, .message-item'),
    );
    const owner = candidates.find((el) => el.textContent?.includes(text));
    if (owner === undefined) {
      return null;
    }
    const ancestors: string[] = [];
    for (
      let node: HTMLElement | null = owner, depth = 0;
      node !== null && depth < 6;
      node = node.parentElement, depth += 1
    ) {
      ancestors.push(String(node.className || node.tagName));
    }
    return { className: String(owner.className), ancestors };
  };
  return {
    chatRecordExists: chatRecord !== null,
    messageItemCount: document.querySelectorAll('.message-item').length,
    chatMessageCount: document.querySelectorAll('.chat-record .chat-message')
      .length,
    selfItemCount: document.querySelectorAll('.item-self').length,
    friendItemCount: document.querySelectorAll('.item-friend').length,
    chatRecordChildren:
      chatRecord === null
        ? []
        : Array.from(chatRecord.children)
            .slice(0, 8)
            .map((el) => String(el.className || el.tagName)),
    // 首条消息项的 class 与子元素结构：用于确认 role 判定方式
    chatMessageShape:
      firstMessage === null
        ? null
        : {
            className: String(firstMessage.className),
            childrenClasses: Array.from(firstMessage.children).map((el) =>
              String(el.className || el.tagName),
            ),
          },
    lastTextOwner: ownerOf(lastText),
  };
};

// 消息项元素沿祖先找 Vue 元信息：$props/$data 中取消息 id 与时间戳（与采集链路同法）
const vueMetaOf = (
  el: HTMLElement,
): {
  msgId: string;
  ts: number;
} | null => {
  for (
    let node: HTMLElement | null = el, depth = 0;
    node !== null && depth < 3;
    node = node.parentElement, depth += 1
  ) {
    const vue = readProperty(node, '__vue__');
    if (vue === undefined) {
      continue;
    }
    for (const source of [
      readProperty(vue, '$props'),
      readProperty(vue, '$data'),
    ]) {
      if (source === null || typeof source !== 'object') {
        continue;
      }
      const msgId = String(
        readProperty(source, 'msgId') ?? readProperty(source, 'msgid') ?? '',
      );
      const ts = readProperty(source, 'lastTS') ?? readProperty(source, 'ts');
      if (msgId !== '' || typeof ts === 'number') {
        return { msgId, ts: typeof ts === 'number' ? ts : 0 };
      }
    }
  }
  return null;
};

// 探测插件可采集的消息预览：文本、角色、DOM 属性与 Vue id/时间，用于无控制台验证
const probeCollectedMessages = (): Record<string, unknown>[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>('.chat-record .message-item'),
  )
    .slice(0, 20)
    .map((item) => {
      const content = item.querySelector<HTMLElement>('.message-content');
      const text = (content?.innerText ?? item.innerText).trim().slice(0, 100);
      // 消息只有自己/招聘者两方：非 item-friend 即自己（页面已无 item-self 标记）
      const role = item.classList.contains('item-friend') ? 'friend' : 'self';
      const domAttrs: Record<string, string> = {};
      for (const attr of item.getAttributeNames().slice(0, 12)) {
        domAttrs[attr] = String(item.getAttribute(attr));
      }
      return { role, text, domAttrs, vueMeta: vueMetaOf(item) };
    });

// 扫描疑似消息数组：$data 各字段中，元素含消息特征键的数组
const scanMessageArrays = (msgData: unknown): Record<string, unknown>[] => {
  const out: Record<string, unknown>[] = [];
  if (msgData === null || typeof msgData !== 'object') {
    return out;
  }
  const MESSAGE_KEYS = [
    'msgId',
    'content',
    'msgType',
    'type',
    'text',
    'isSelf',
    'fromType',
    'toType',
  ];
  for (const key of Object.keys(msgData)) {
    const value = readProperty(msgData, key);
    if (!Array.isArray(value)) {
      continue;
    }
    if (value.length === 0) {
      out.push({ key, length: 0 });
      continue;
    }
    const first = value[0];
    if (first === null || typeof first !== 'object') {
      continue;
    }
    const firstKeys = Object.keys(first);
    out.push({
      key,
      length: value.length,
      looksLikeMessage: firstKeys.some((k) => MESSAGE_KEYS.includes(k)),
      firstKeys: firstKeys.slice(0, 20),
    });
  }
  return out;
};

// 深挖已知数据持有组件：会话列表首项、当前 boss、消息数组扫描、消息 DOM 结构
const deepDive = (root: unknown): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const labelInstance = findInstanceByName(root, 'boss-list-label', 0);
  if (labelInstance !== undefined) {
    const friends = readProperty(
      readProperty(labelInstance, '$data'),
      'friends',
    );
    if (Array.isArray(friends) && friends.length > 0) {
      result.friendFirst = fieldsOf(friends[0]);
      result.friendSecond =
        friends.length > 1 ? fieldsOf(friends[1]) : undefined;
      // 首元素真实结构：类型与可枚举字段，判定 friends 是否为联系人对象数组
      result.friendShape = shapeOf(friends[0]);
    }
  }
  // 虚拟列表与联系人列表组件的 props：完整数据可能挂在 props 而非 data
  const virtualList = findInstanceByName(root, 'virtual-list', 0);
  if (virtualList !== undefined) {
    result.virtualListProps = fieldsOf(readProperty(virtualList, '$props'));
    const sources = readProperty(
      readProperty(virtualList, '$props'),
      'dataSources',
    );
    if (Array.isArray(sources) && sources.length > 0) {
      result.virtualDataFirst = fieldsOf(sources[0]);
    }
  }
  const bossList = findInstanceByName(root, 'boss-list', 0);
  if (bossList !== undefined) {
    result.bossListData = fieldsOf(readProperty(bossList, '$data'));
  }
  const msgInstance = findInstanceByName(root, 'message-list', 0);
  if (msgInstance !== undefined) {
    const msgData = readProperty(msgInstance, '$data');
    result.boss = fieldsOf(readProperty(msgData, 'boss'));
    // $data 字段形状：数组记长度，对象记键，定位消息数据可能的位置
    result.dataShape =
      msgData !== null && typeof msgData === 'object'
        ? Object.keys(msgData).map((key) => {
            const value = readProperty(msgData, key);
            return {
              key,
              type: Array.isArray(value)
                ? `array[${value.length}]`
                : value === null
                  ? 'null'
                  : typeof value,
            };
          })
        : [];
    // 疑似消息数组扫描：找出含消息特征键的数组字段
    result.messageArrays = scanMessageArrays(msgData);
    // 消息 DOM 结构：用最近消息文本定位归属元素
    const boss = readProperty(msgData, 'boss');
    const lastText =
      boss !== null && typeof boss === 'object'
        ? String(readProperty(boss, 'lastText') ?? '')
        : '';
    result.messageDom = probeMessageDom(lastText);
  }
  // 逐条消息采集预览：插件采集链路能拿到的文本、角色、id/时间与 DOM 属性
  result.messages = probeCollectedMessages();
  return result;
};

// 探测聊天页 Vue 数据：各挂载点实例概览 + 组件树中有数据的实例清单 + 深挖关键组件
const probeChatData = (): unknown => {
  const mounts: Record<string, unknown>[] = [];
  const dataInstances: Record<string, unknown>[] = [];
  let root: unknown;
  for (const selector of MOUNT_CANDIDATES) {
    const element = document.querySelector(selector);
    if (element === null) {
      continue;
    }
    const vue = readProperty(element, '__vue__');
    if (vue === undefined) {
      continue;
    }
    mounts.push({ selector, ...instanceOverview(vue) });
    collectDataInstances(vue, 0, dataInstances);
    root = vue;
  }
  return { mounts, dataInstances, deepDive: deepDive(root) };
};

// 渲染探测结果到面板：JSON 展示，点击 pre 全选便于复制
const renderResult = (panel: HTMLElement, result: unknown): void => {
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  pre.style.cssText =
    'margin:0;padding:12px;font:12px/1.5 monospace;color:#333;background:#fff;overflow:auto;white-space:pre-wrap;word-break:break-all;';
  pre.addEventListener('click', () => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(pre);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  panel.append(pre);
};

// 渲染采集日志区：debugLog 写入隐藏节点的日志，作为无 DevTools 环境的日志出口
const renderLogs = (panel: HTMLElement): void => {
  const logs = readDebugLogs();
  if (logs.length === 0) {
    return;
  }
  const label = document.createElement('div');
  label.textContent = '采集日志（点击全选复制）';
  label.style.cssText =
    'padding:8px 12px 0;font-size:12px;font-weight:600;color:#666;border-top:1px solid #eee;';
  const pre = document.createElement('pre');
  pre.textContent = logs.join('\n');
  pre.style.cssText =
    'margin:4px 0 0;padding:12px;font:12px/1.5 monospace;color:#333;background:#fff;white-space:pre-wrap;word-break:break-all;';
  pre.addEventListener('click', () => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(pre);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  panel.append(label, pre);
};

// 创建探测面板：固定定位，展示最近一次探测结果
const showProbePanel = (): void => {
  if (document.querySelector(`[${PROBE_PANEL_FLAG}]`) !== null) {
    return;
  }
  const panel = document.createElement('div');
  panel.dataset.hijobProbePanel = '1';
  panel.style.cssText =
    'position:fixed;right:16px;bottom:56px;z-index:2147483646;width:420px;max-height:70vh;display:flex;flex-direction:column;border:1px solid #ddd;border-radius:8px;background:#fafafa;box-shadow:0 4px 16px rgba(0,0,0,.25);overflow:hidden;';
  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eee;background:#f5f5f5;';
  const title = document.createElement('span');
  title.textContent = '聊天页数据探测结果';
  title.style.cssText = 'font-size:13px;font-weight:600;color:#333;';
  const close = document.createElement('button');
  close.textContent = '关闭';
  close.style.cssText =
    'padding:2px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;';
  close.addEventListener('click', () => panel.remove());
  header.append(title, close);
  panel.append(header);
  document.body.append(panel);
  renderResult(panel, probeChatData());
  renderLogs(panel);
};

// 判定隔离世界桥转发来的调试开关变更通知
const isDebugSettingsChangedNotify = (data: unknown): boolean =>
  readProperty(data, 'namespace') === WINDOW_NOTIFY_NAMESPACE &&
  readProperty(data, 'type') === WINDOW_NOTIFY_DEBUG_SETTINGS_CHANGED;

// 移除探测按钮与面板：开关关闭时清理页面残留
const removeProbeButton = (): void => {
  document.querySelector(`[${PROBE_BUTTON_FLAG}]`)?.remove();
  document.querySelector(`[${PROBE_PANEL_FLAG}]`)?.remove();
};

// 注入探测按钮：右下角悬浮按钮，点击切换数据面板
const injectProbeButton = (): void => {
  if (document.querySelector(`[${PROBE_BUTTON_FLAG}]`) !== null) {
    return;
  }
  const button = document.createElement('button');
  button.dataset.hijobProbe = '1';
  button.textContent = '探测聊天数据';
  button.style.cssText =
    'position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:8px 14px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#333;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);';
  button.addEventListener('click', () => {
    const existing = document.querySelector(`[${PROBE_PANEL_FLAG}]`);
    if (existing !== null) {
      existing.remove();
      return;
    }
    showProbePanel();
  });
  document.body.append(button);
};

// 按调试开关应用探测按钮：开启注入，关闭移除
const applyChatProbe = async (): Promise<void> => {
  const settings = await extensionApi.getDebugSettings();
  if (!settings.chatProbeEnabled) {
    removeProbeButton();
    return;
  }
  injectProbeButton();
};

// 启动探测：仅聊天页激活，注册调试开关通知并首次应用按钮
const startChatProbe = (): void => {
  if (
    !location.pathname.includes('/chat') &&
    document.querySelector('.chat-container') === null
  ) {
    return;
  }
  // 调试开关变更时即时注入/移除按钮
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    if (isDebugSettingsChangedNotify(event.data)) {
      void applyChatProbe();
    }
  });
  void applyChatProbe();
};

export { startChatProbe };
