// # 职位详情页数据探测（主世界，临时工具）：注入探测按钮，dump 详情页 Vue 数据与字段归属区域
//
// 目标：定位独立详情页（/job_detail/）各字段的真实挂载点。该页字段分散在
// banner（.job-primary.detail-box，标题/薪资）与详情区（描述/招聘者/地址），
// 探测结果直接回答「哪个选择器在哪个区块能取到文本」，排查字段抓空类问题。

import {
  WINDOW_NOTIFY_DEBUG_SETTINGS_CHANGED,
  WINDOW_NOTIFY_NAMESPACE,
} from '@/pages/world/rpc';
import { readDebugLogs } from '@/shared/lib/debug-log';
import { readProperty } from '@/shared/lib/page-property';

import { extensionApi } from './background-rpc';

// 详情页候选 Vue 挂载点：按优先级逐个探测（SSR 静态页根是 #main，App 版根是 #app）
const MOUNT_CANDIDATES = [
  '#app',
  '#main',
  '.job-primary.detail-box',
  '.job-detail',
  '.job-detail-header',
  '.job-boss-info',
];

// 按钮与面板元素标记，防重复注入
const PROBE_BUTTON_FLAG = 'data-hijob-jd-detail-probe';
const PROBE_PANEL_FLAG = 'data-hijob-jd-detail-probe-panel';

// 采集链路字段 -> 候选选择器（banner 内优先，回退全文档），与 parse-jd 保持一致
const FIELD_PROBES: { field: string; selectors: string[] }[] = [
  {
    field: '标题 title',
    selectors: ['.job-detail-info .job-name', '.name h1'],
  },
  {
    field: '薪资 salary',
    selectors: ['.job-detail-info .job-salary', '.name .salary'],
  },
  { field: '招聘者 recruiter', selectors: ['.boss-info-attr'] },
  {
    field: '招聘者活跃 recruiterActive',
    selectors: ['.job-boss-info .boss-active-time', '.boss-online-tag'],
  },
  { field: '描述 description', selectors: ['.job-sec-text', '.desc'] },
  {
    field: '地址 address',
    selectors: ['.job-address-desc', '.location-address'],
  },
  { field: '公司规模 companyScale', selectors: ['.sider-company .icon-scale'] },
  {
    field: '公司行业 companyIndustry',
    selectors: ['.sider-company .icon-industry'],
  },
];

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
const instanceOverview = (
  instance: unknown,
): {
  name: string;
  dataKeys: Record<string, string>;
  setupKeys: Record<string, string>;
} => ({
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

// 探测详情页各字段归属区域：banner 内命中优先，未命中再到全文档，未命中标记 none
const probeFieldRegions = (): Record<string, unknown>[] => {
  const banner = document.querySelector<HTMLElement>('.job-primary.detail-box');
  const excerptOf = (el: HTMLElement): string => {
    // 图标元素自身无文本（如 .icon-scale），回退父级 <p> 的 innerText
    const picked =
      el.innerText.trim() || el.parentElement?.innerText.trim() || '';
    return picked.length > 120 ? `${picked.slice(0, 120)}…` : picked;
  };
  return FIELD_PROBES.map(({ field, selectors }) => {
    // 先看字段是否落在 banner 内，再回退全文档
    for (const selector of selectors) {
      const inBanner = banner?.querySelector<HTMLElement>(selector);
      if (inBanner !== undefined && inBanner !== null) {
        return {
          field,
          selector,
          box: 'banner' as const,
          excerpt: excerptOf(inBanner),
        };
      }
      const docMatch = document.querySelector<HTMLElement>(selector);
      if (docMatch !== null) {
        return {
          field,
          selector,
          box: 'doc' as const,
          excerpt: excerptOf(docMatch),
        };
      }
    }
    return {
      field,
      selector: selectors.join(' / '),
      box: 'none' as const,
      excerpt: '',
    };
  });
};

// 探测详情页 Vue 数据：各挂载点实例概览 + 数据实例树 + 字段归属区域概览
const probeDetailData = (): Record<string, unknown> => {
  const mounts: Record<string, unknown>[] = [];
  const dataInstances: Record<string, unknown>[] = [];
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
  }
  // 详情页锚点链接与标签量：确认采集链路里的 url 与 tags 来源
  const moreJobUrl =
    document.querySelector<HTMLAnchorElement>('.more-job-btn')?.href ?? null;
  const tagCount = document.querySelectorAll(
    '.job-detail-header .tag-list li, .job-label-list li',
  ).length;
  return {
    url: document.location?.href ?? '',
    mounts,
    dataInstances: dataInstances.slice(0, 40),
    fields: probeFieldRegions(),
    moreJobUrl,
    tagCount,
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
  panel.dataset.hijobJdDetailProbePanel = '1';
  panel.style.cssText =
    'position:fixed;right:16px;bottom:56px;z-index:2147483646;width:420px;max-height:70vh;display:flex;flex-direction:column;border:1px solid #ddd;border-radius:8px;background:#fafafa;box-shadow:0 4px 16px rgba(0,0,0,.25);overflow:hidden;';
  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eee;background:#f5f5f5;';
  const title = document.createElement('span');
  title.textContent = '职位详情页数据探测结果';
  title.style.cssText = 'font-size:13px;font-weight:600;color:#333;';
  const close = document.createElement('button');
  close.textContent = '关闭';
  close.style.cssText =
    'padding:2px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;';
  close.addEventListener('click', () => panel.remove());
  header.append(title, close);
  panel.append(header);
  document.body.append(panel);
  renderResult(panel, probeDetailData());
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
  button.dataset.hijobJdDetailProbe = '1';
  button.textContent = '探测职位详情数据';
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
const applyJdDetailProbe = async (): Promise<void> => {
  const settings = await extensionApi.getDebugSettings();
  if (!settings.detailProbeEnabled) {
    removeProbeButton();
    return;
  }
  injectProbeButton();
};

// 启动探测：仅职位详情页激活，注册调试开关通知并首次应用按钮
const startJdDetailProbe = (): void => {
  if (!location.pathname.includes('/job_detail/')) {
    return;
  }
  // 调试开关变更时即时注入/移除按钮
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    if (isDebugSettingsChangedNotify(event.data)) {
      void applyJdDetailProbe();
    }
  });
  void applyJdDetailProbe();
};

export { startJdDetailProbe };
