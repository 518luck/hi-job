// # 职位卡片已沟通标记（隔离世界）：按 HR 档案给沟通过公司的卡片标「已沟通」
import { sendMessage } from '@/shared/infra/messaging';
import { readProperty } from '@/shared/lib/page-property';

// 防抖等待时长：滚动加载新卡片后等渲染稳定（与装饰器一致）
const DEBOUNCE_MS = 500;

// 标记类名：hijob 前缀避免与宿主页面冲突
const CHATTED_CLASS = 'hijob-chatted-tag';

// HR 档案变更通知类型：与后台 broadcastNotify 约定一致
const NOTIFY_TYPE = 'hrs-changed';

// 已沟通公司名缓存：去首尾空格后的公司名（保留大小写，匹配时再规范化）
const chattedNames: string[] = [];

// 名单是否已成功拉取：无卡片页面延迟到首张卡片出现再拉
let namesLoaded = false;

// 注入标记样式：跟随宿主页面的青色小标，风格对齐装饰器灰字标签
const ensureStyle = ({ doc }: { doc: Document }): void => {
  if (doc.querySelector('style[data-hijob-chatted-style]') !== null) {
    return;
  }
  const style = doc.createElement('style');
  style.dataset.hijobChattedStyle = '1';
  style.textContent = `.${CHATTED_CLASS}{font-size:12px;color:#00bebd;font-weight:600;white-space:nowrap;}`;
  doc.head.append(style);
};

// 读卡片公司名：footer 的 boss-name 文本，匿名公司同样是其显示名
const companyNameOfCard = (card: HTMLElement): string =>
  card.querySelector('.boss-name')?.textContent?.trim() ?? '';

// 返回命中的已沟通公司名：包含匹配（不区分大小写），未命中返回空串
const matchedNameOf = (companyName: string): string => {
  const normalized = companyName.toLowerCase();
  return (
    chattedNames.find((name) => normalized.includes(name.toLowerCase())) ?? ''
  );
};

// 同步单张卡片：命中在 footer 追加「已沟通」标，未命中移除
const syncCard = ({
  card,
  companyName,
}: {
  card: HTMLElement;
  companyName: string;
}): void => {
  const matched = companyName !== '' ? matchedNameOf(companyName) : '';
  const tag = card.querySelector<HTMLElement>(`.${CHATTED_CLASS}`);
  if (matched === '') {
    tag?.remove();
    return;
  }
  if (tag === null) {
    const footer = card.querySelector('.job-card-footer');
    if (footer === null) {
      return;
    }
    const created = document.createElement('span');
    created.className = CHATTED_CLASS;
    created.textContent = '已沟通';
    footer.append(created);
  }
};

// 同步当前页全部卡片：列表滚动加载后调用
const syncAllCards = ({ doc }: { doc: Document }): void => {
  for (const card of doc.querySelectorAll<HTMLElement>('.job-card-box')) {
    syncCard({ card, companyName: companyNameOfCard(card) });
  }
};

// 从后台拉取已沟通公司名并重渲染；失败时下次页面变化重试
const loadChattedNames = async ({ doc }: { doc: Document }): Promise<void> => {
  try {
    const names = await sendMessage('getChattedCompanyNames', undefined);
    chattedNames.length = 0;
    chattedNames.push(
      ...names.map((name) => name.trim()).filter((name) => name !== ''),
    );
    namesLoaded = true;
  } catch {
    // 后台不可达时保持现名单，不阻塞页面其他功能
  }
  syncAllCards({ doc });
};

// 同步入口：名单未拉取且页面已有职位卡片时先拉名单，无卡片页面不发请求
const syncWithNames = ({ doc }: { doc: Document }): void => {
  if (!namesLoaded && doc.querySelector('.job-card-box') !== null) {
    void loadChattedNames({ doc });
    return;
  }
  syncAllCards({ doc });
};

// 启动已沟通标记：页面变化（含滚动加载新卡）防抖补同步，HR 档案变更通知重拉
const startJobCardChatted = ({ doc }: { doc: Document }): void => {
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

  // HR 档案变更通知：后台广播经 tabs 送达隔离世界，直接重拉名单
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (readProperty(message, 'hiJobNotify') === NOTIFY_TYPE) {
      void loadChattedNames({ doc });
    }
  });
};

export { startJobCardChatted };
