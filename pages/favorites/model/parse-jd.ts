import type { SelectedJd } from '@/shared/zod/jd';

// 取第一个匹配元素的文本，找不到返回空串
const textOf = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

// 合并头部基本信息与"职位描述"下方技能标签两处 tag，去空去重
const collectTags = (root: ParentNode): string[] => {
  const items = [
    ...root.querySelectorAll('.job-detail-header .tag-list li'),
    ...root.querySelectorAll('.job-label-list li'),
  ];
  const tags = items
    .map((li) => li.textContent?.trim() ?? '')
    .filter((tag) => tag !== '');
  return [...new Set(tags)];
};

// 从 Boss直聘 页面解析当前选中的职位（JD）；未选中任何职位时返回 null
const parseSelectedJd = (doc: Document): SelectedJd | null => {
  const detailBox = doc.querySelector<HTMLElement>('.job-detail-box');
  if (detailBox === null) {
    return null;
  }

  // > 详情链接取自"查看更多信息"按钮，可唯一定位职位；回退为当前页地址
  const url =
    detailBox.querySelector<HTMLAnchorElement>('.more-job-btn')?.href ||
    doc.location?.href ||
    '';

  return {
    title: textOf(detailBox, '.job-detail-info .job-name'),
    salary: textOf(detailBox, '.job-detail-info .job-salary'),
    tags: collectTags(detailBox),
    recruiter: textOf(detailBox, '.boss-info-attr'),
    description:
      detailBox.querySelector<HTMLElement>('.desc')?.innerText.trim() ?? '',
    address: textOf(detailBox, '.job-address-desc'),
    url,
  };
};

export { parseSelectedJd };
