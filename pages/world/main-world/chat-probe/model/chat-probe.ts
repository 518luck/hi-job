// # 聊天页数据探测（主世界，临时工具）：注入 test 按钮，dump 聊天页 Vue 数据
//
// 目标：确认聊天页 Vue 实例的挂载点与会话/消息数据结构，为 HR badge 与 AI 问答功能定字段。
import { readDebugLogs } from '@/shared/lib/debug-log';
import { readProperty } from '@/shared/lib/page-property';

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

// 深挖已知数据持有组件：会话列表首项、当前 boss、消息数组首条
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
    }
  }
  const msgInstance = findInstanceByName(root, 'message-list', 0);
  if (msgInstance !== undefined) {
    const msgData = readProperty(msgInstance, '$data');
    result.boss = fieldsOf(readProperty(msgData, 'boss'));
    // 消息数据：$data 中所有非空数组字段的首条结构
    const messageArrays: Record<string, unknown>[] = [];
    if (msgData !== null && typeof msgData === 'object') {
      for (const key of Object.keys(msgData)) {
        const value = readProperty(msgData, key);
        if (Array.isArray(value) && value.length > 0) {
          messageArrays.push({ key, first: fieldsOf(value[0]) });
        }
      }
    }
    result.messageArrays = messageArrays;
  }
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

// 启动探测：仅聊天页激活，右下角注入悬浮按钮，点击显示数据面板
const startChatProbe = (): void => {
  if (
    !location.pathname.includes('/chat') &&
    document.querySelector('.chat-container') === null
  ) {
    return;
  }
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

export { startChatProbe };
