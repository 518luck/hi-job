// # 职位卡片遮罩（隔离世界）：按屏蔽名单给职位列表卡片盖「已屏蔽」遮罩
import { sendMessage } from '@/shared/infra/messaging';
import { readProperty } from '@/shared/lib/page-property';

// 防抖等待时长：滚动加载新卡片后等渲染稳定（与装饰器一致）
const DEBOUNCE_MS = 500;

// 遮罩类名：hijob 前缀避免与宿主页面冲突
const MASK_CLASS = 'hijob-block-mask';

// 名单变更通知类型：与后台 broadcastNotify 约定一致
const NOTIFY_TYPE = 'blocked-companies-changed';

// 屏蔽名单缓存：去首尾空格后的原始公司名（保留大小写，匹配时再规范化）
const blockedNames: string[] = [];

// 名单是否已成功拉取：聊天页等无卡片页面延迟到首张职位卡片出现再拉
let namesLoaded = false;

// 注入遮罩样式：卡片相对定位 + 白底遮罩，风格对齐聊天页「已 Pass」遮罩
const ensureStyle = ({ doc }: { doc: Document }): void => {
  if (doc.querySelector('style[data-hijob-blocker-style]') !== null) {
    return;
  }
  const style = doc.createElement('style');
  style.dataset.hijobBlockerStyle = '1';
  style.textContent = [
    '.job-card-box{position:relative;}',
    `.${MASK_CLASS}{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:rgba(255,255,255,.92);color:#999;font-size:14px;font-weight:600;letter-spacing:1px;z-index:5;}`,
    `.${MASK_CLASS}-original{font-size:12px;font-weight:400;letter-spacing:0;color:#aaa;}`,
  ].join('\n');
  doc.head.append(style);
};

// 读卡片公司名：footer 的 boss-name 文本，匿名公司同样是其显示名
const companyNameOfCard = (card: HTMLElement): string =>
  card.querySelector('.boss-name')?.textContent?.trim() ?? '';

// 返回命中的屏蔽词：包含匹配（不区分大小写），未命中返回空串
const matchedNameOf = (companyName: string): string => {
  const normalized = companyName.toLowerCase();
  return (
    blockedNames.find((name) => normalized.includes(name.toLowerCase())) ?? ''
  );
};

// 写入遮罩行文案：文本不变不写，避免自身的 DOM 写入触发页面观察者循环
const setLineText = (line: Element | null, text: string): void => {
  if (line !== null && line.textContent !== text) {
    line.textContent = text;
  }
};

// 同步单张卡片：命中盖两行遮罩（第一行命中词、第二行公司原名），未命中移除
const syncCard = ({
  card,
  companyName,
}: {
  card: HTMLElement;
  companyName: string;
}): void => {
  const matched = companyName !== '' ? matchedNameOf(companyName) : '';
  let mask = card.querySelector<HTMLElement>(`.${MASK_CLASS}`);
  if (matched === '') {
    mask?.remove();
    return;
  }
  if (mask === null) {
    mask = document.createElement('div');
    mask.className = MASK_CLASS;
    const original = document.createElement('div');
    original.className = `${MASK_CLASS}-original`;
    mask.append(document.createElement('div'), original);
    card.append(mask);
  }
  setLineText(mask.firstElementChild, `已屏蔽：${matched}`);
  setLineText(mask.lastElementChild, `公司原名：${companyName}`);
};

// 同步当前页全部卡片：列表滚动加载后调用
const syncAllCards = ({ doc }: { doc: Document }): void => {
  for (const card of doc.querySelectorAll<HTMLElement>('.job-card-box')) {
    syncCard({ card, companyName: companyNameOfCard(card) });
  }
};

// 从后台拉取屏蔽名单并重渲染；失败时下次页面变化重试
const loadBlockedNames = async ({ doc }: { doc: Document }): Promise<void> => {
  try {
    const names = await sendMessage('getBlockedCompanyNames', undefined);
    blockedNames.length = 0;
    blockedNames.push(
      ...names.map((name) => name.trim()).filter((name) => name !== ''),
    );
    namesLoaded = true;
  } catch {
    // 后台不可达时保持现名单，不阻塞页面其他功能
  }
  syncAllCards({ doc });
};

// 同步入口：名单未拉取且页面已有职位卡片时先拉名单，聊天页等无卡片页面不发请求
const syncWithNames = ({ doc }: { doc: Document }): void => {
  if (!namesLoaded && doc.querySelector('.job-card-box') !== null) {
    void loadBlockedNames({ doc });
    return;
  }
  syncAllCards({ doc });
};

// 启动遮罩：页面变化（含滚动加载新卡）防抖补同步，名单变更通知重拉
const startJobCardBlocker = ({ doc }: { doc: Document }): void => {
  ensureStyle({ doc });
  syncWithNames({ doc });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => syncWithNames({ doc }), DEBOUNCE_MS);
  };
  schedule();

  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // 名单变更通知：后台广播经 tabs 送达隔离世界，直接重拉名单
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (readProperty(message, 'hiJobNotify') === NOTIFY_TYPE) {
      void loadBlockedNames({ doc });
    }
  });
};

export { startJobCardBlocker };
