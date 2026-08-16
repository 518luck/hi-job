// # 职位页数据探测（主世界，临时工具）：注入探测按钮，dump 职位页 Vue 数据
//
// 目标：确认职位列表/详情页 Vue 实例的挂载点与职位数据结构，
// 为采集字段定来源，并排查「薪资/公司信息抓不到」类问题。

import { readProperty } from '@/shared/lib/page-property';

// 探测的 Vue 挂载点：职位详情面板与列表主容器
const DETAIL_SELECTOR = '.job-detail-box';
const MAIN_SELECTOR = '.page-jobs-main';

// 按钮与面板元素标记，防重复注入
const PROBE_BUTTON_FLAG = 'data-hijob-jd-probe';
const PROBE_PANEL_FLAG = 'data-hijob-jd-probe-panel';

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

// 深一层字段概览：顶层字段中的嵌套对象再展开一层，便于看 jobInfo/bossInfo 内部
const deepFieldsOf = (obj: unknown): Record<string, unknown> => {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).slice(0, 40)) {
    const value = readProperty(obj, key);
    out[key] =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? fieldsOf(value)
        : briefOf(value);
  }
  return out;
};

// 读取元素挂载的 Vue 实例
const vueOf = (selector: string): unknown =>
  readProperty(document.querySelector(selector), '__vue__');

// 读取实例数据：$data 为空时回退实例自身的 data 字段（部分数据挂在非响应式字段上）
const dataOf = (instance: unknown): unknown => {
  const data = readProperty(instance, '$data');
  if (
    data !== null &&
    typeof data === 'object' &&
    Object.keys(data).length > 0
  ) {
    return data;
  }
  return readProperty(instance, 'data');
};

// jobList 概览：数组长度 + 首个卡片的字段结构
const briefList = (jobList: unknown): unknown => {
  if (!Array.isArray(jobList)) {
    return briefOf(jobList);
  }
  return {
    length: jobList.length,
    first: jobList.length > 0 ? fieldsOf(jobList[0]) : undefined,
  };
};

// 探测职位页 Vue 数据：详情面板数据展开两层，列表根的 currentJob 与 jobList 概览
const probeJdData = (): Record<string, unknown> => {
  const detailVue = vueOf(DETAIL_SELECTOR);
  const mainVue = vueOf(MAIN_SELECTOR);
  return {
    'job-detail-box.__vue__.data':
      detailVue === undefined ? '元素不存在' : deepFieldsOf(dataOf(detailVue)),
    'page-jobs-main.__vue__.currentJob':
      mainVue === undefined
        ? '元素不存在'
        : fieldsOf(readProperty(mainVue, 'currentJob')),
    'page-jobs-main.__vue__.jobList':
      mainVue === undefined
        ? '元素不存在'
        : briefList(readProperty(mainVue, 'jobList')),
  };
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

// 创建探测面板：固定定位，展示最近一次探测结果
const showProbePanel = (): void => {
  if (document.querySelector(`[${PROBE_PANEL_FLAG}]`) !== null) {
    return;
  }
  const panel = document.createElement('div');
  panel.dataset.hijobJdProbePanel = '1';
  panel.style.cssText =
    'position:fixed;right:16px;bottom:56px;z-index:2147483646;width:420px;max-height:70vh;display:flex;flex-direction:column;border:1px solid #ddd;border-radius:8px;background:#fafafa;box-shadow:0 4px 16px rgba(0,0,0,.25);overflow:hidden;';
  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eee;background:#f5f5f5;';
  const title = document.createElement('span');
  title.textContent = '职位页数据探测结果';
  title.style.cssText = 'font-size:13px;font-weight:600;color:#333;';
  const close = document.createElement('button');
  close.textContent = '关闭';
  close.style.cssText =
    'padding:2px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;';
  close.addEventListener('click', () => panel.remove());
  header.append(title, close);
  panel.append(header);
  document.body.append(panel);
  renderResult(panel, probeJdData());
};

// 启动探测：仅职位页激活，右下角注入悬浮按钮，点击显示数据面板
const startJdProbe = (): void => {
  if (
    !location.pathname.includes('/web/geek/job') &&
    !location.pathname.includes('/job_detail/') &&
    document.querySelector(`${MAIN_SELECTOR}, ${DETAIL_SELECTOR}`) === null
  ) {
    return;
  }
  if (document.querySelector(`[${PROBE_BUTTON_FLAG}]`) !== null) {
    return;
  }
  const button = document.createElement('button');
  button.dataset.hijobJdProbe = '1';
  button.textContent = '探测职位数据';
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

export { startJdProbe };
