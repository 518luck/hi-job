// # 调试日志：隐藏 DOM 节点 + 控制台双写，配探测面板实现无 DevTools 查看日志
//
// Boss直聘 打开 DevTools 会触发页面反调试（闪退 + 临时封号），日志不能依赖控制台；
// 主世界与隔离世界共享 DOM，统一写入隐藏节点，由 jd-probe 面板读取展示。

// 日志宿主元素标记
const DEBUG_LOG_HOST_FLAG = 'data-hijob-debug-log';

// 单条日志文本的最大长度，防止大对象刷屏
const MAX_ENTRY_LENGTH = 300;

// 日志条数上限：超出淘汰最旧条目，避免隐藏 DOM 无限累积
const MAX_ENTRIES = 200;

// 把任意值压成文本：Error 取 message，对象尝试 JSON 序列化，失败退化为 String
const textOf = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return value.message;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

// 确保日志宿主存在：display:none 的容器节点，两世界共用
const ensureHost = (): HTMLElement => {
  let host = document.querySelector<HTMLElement>(`[${DEBUG_LOG_HOST_FLAG}]`);
  if (host === null) {
    host = document.createElement('div');
    host.dataset.hijobDebugLog = '1';
    host.style.display = 'none';
    document.documentElement.append(host);
  }
  return host;
};

// 输出调试日志：隐藏节点 + 控制台双写，探测面板负责展示
const debugLog = (...args: unknown[]): void => {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const text = args.map(textOf).join(' ').slice(0, MAX_ENTRY_LENGTH);
  const entry = document.createElement('div');
  entry.textContent = `[${time}] ${text}`;
  const host = ensureHost();
  host.append(entry);
  // 超出上限淘汰最旧条目，日志缓冲保持恒定大小
  while (host.childElementCount > MAX_ENTRIES) {
    host.firstElementChild?.remove();
  }
  console.log('[hi-job]', ...args);
};

// 读取当前页面会话的全部调试日志文本
const readDebugLogs = (): string[] =>
  [...document.querySelectorAll<HTMLElement>(`[${DEBUG_LOG_HOST_FLAG}] > div`)]
    .map((item) => item.textContent ?? '')
    .filter((item) => item !== '');

export { debugLog, readDebugLogs };
