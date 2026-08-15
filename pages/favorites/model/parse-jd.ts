import type { SelectedJd } from '@/shared/zod/jd';

// 取第一个匹配元素的文本，找不到返回空串
const textOf = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

// 从 Boss直聘 页面解析当前选中的职位（JD）；未选中任何职位时返回 null
const parseSelectedJd = (doc: Document): SelectedJd | null => {
  const detailBox = doc.querySelector<HTMLElement>('.job-detail-box');
  if (detailBox === null) {
    return null;
  }

  const tags = Array.from(
    detailBox.querySelectorAll('.job-detail-header .tag-list li'),
  )
    .map((li) => li.textContent?.trim() ?? '')
    .filter((tag) => tag !== '');

  return {
    title: textOf(detailBox, '.job-detail-info .job-name'),
    salary: textOf(detailBox, '.job-detail-info .job-salary'),
    tags,
    recruiter: textOf(detailBox, '.boss-info-attr'),
    description:
      detailBox.querySelector<HTMLElement>('.desc')?.innerText.trim() ?? '',
    address: textOf(detailBox, '.job-address-desc'),
    url: doc.location?.href ?? '',
  };
};

export { parseSelectedJd };
