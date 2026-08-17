// # 职位卡片装饰器：往列表卡片注入公司规模标签，数据来自主世界 Vue 原始 jobList
import { requestJobCards } from './vue-job-data';

// 防抖等待时长：滚动加载新卡片后等渲染稳定
const DEBOUNCE_MS = 500;

// 已装饰标记属性：避免对同一张卡重复注入
const DECORATED_FLAG = 'data-hijob-decorated';

// 从卡片职位链接提取职位 id（与 jobList 的 encryptJobId 一致）
const jobIdOfCard = (card: HTMLElement): string => {
  const href =
    card.querySelector<HTMLAnchorElement>('.job-name')?.getAttribute('href') ??
    '';
  return href.match(/\/job_detail\/([^.]+)\.html/)?.[1] ?? '';
};

// 给单张卡片的底部注入规模标签；样式跟随宿主页面的灰字风格
const decorateCard = ({
  card,
  scale,
}: {
  card: HTMLElement;
  scale: string;
}): void => {
  const footer = card.querySelector('.job-card-footer');
  if (footer === null) {
    return;
  }
  const label = document.createElement('span');
  label.textContent = scale;
  label.style.cssText = 'font-size:12px;color:#999;white-space:nowrap;';
  footer.append(label);
  card.setAttribute(DECORATED_FLAG, '1');
};

// 拉取一次卡片数据并装饰当前页所有未装饰的卡片；无数据的卡不标记，等下次变化重试
const decorateOnce = async ({ doc }: { doc: Document }): Promise<void> => {
  const cardElements = doc.querySelectorAll<HTMLElement>('.job-card-box');
  // 页面上没有职位卡片（聊天页等）时直接跳过，不发起数据请求
  if (cardElements.length === 0) {
    return;
  }
  // 全部卡片已装饰时直接跳过，不发数据请求（避免挂机时的空转取数）
  const undecorated = [...cardElements].filter(
    (card) => card.getAttribute(DECORATED_FLAG) !== '1',
  );
  if (undecorated.length === 0) {
    return;
  }
  const cards = await requestJobCards();
  for (const card of undecorated) {
    const info = cards[jobIdOfCard(card)];
    if (info === undefined || info.companyScale === '') {
      continue;
    }
    decorateCard({ card, scale: info.companyScale });
  }
};

// 启动装饰器：页面变化（含滚动加载新卡）后防抖补装饰
const startJobCardDecorator = ({ doc }: { doc: Document }): void => {
  const schedule = () => {
    void decorateOnce({ doc }).catch(() => {});
  };

  // 页面加载时列表可能已渲染，先装饰一次
  schedule();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(schedule, DEBOUNCE_MS);
  });
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

export { startJobCardDecorator };
