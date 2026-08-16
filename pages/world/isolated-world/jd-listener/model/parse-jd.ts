import type { SelectedJd } from '@/shared/zod';

import { requestVueJobData } from './vue-job-data';

// 取第一个匹配元素的文本，找不到返回空串
const textOf = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

// 从职位详情链接中提取职位唯一 id
const jobIdOfUrl = (url: string): string => {
  const match = url.match(/\/job_detail\/([^.]+)\.html/);
  return match?.[1] ?? '';
};

// 解析公司标识与名称：优先取选中卡片的公司链接；匿名或无卡片时按名称聚合
const parseCompany = (
  doc: Document,
): {
  companyId: string;
  companyName: string;
} => {
  const companyHref =
    doc
      .querySelector<HTMLAnchorElement>('.job-card-wrap.active .boss-info')
      ?.getAttribute('href') ?? '';
  const idMatch = companyHref.match(/\/gongsi\/([^.]+)\.html/);

  const cardName = textOf(doc, '.job-card-wrap.active .boss-name');
  const detailName = textOf(doc, '.job-boss-info .boss-info-attr')
    .split('·')[0]
    ?.trim();
  const companyName = cardName || detailName || '未知公司';

  return { companyId: idMatch?.[1] ?? `anonymous:${companyName}`, companyName };
};

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
const parseSelectedJd = async (doc: Document): Promise<SelectedJd | null> => {
  const detailBox = doc.querySelector<HTMLElement>('.job-detail-box');
  if (detailBox === null) {
    return null;
  }

  // > 详情链接取自"查看更多信息"按钮，可唯一定位职位；回退为当前页地址
  const url =
    detailBox.querySelector<HTMLAnchorElement>('.more-job-btn')?.href ||
    doc.location?.href ||
    '';

  const { companyId, companyName } = parseCompany(doc);

  // 请求主世界的 Vue 原始数据：公司规模/行业直接取用；薪资读不到时回退 DOM 文本
  const vueJobData = await requestVueJobData();

  return {
    jobId: jobIdOfUrl(url),
    companyId,
    companyName,
    companyIndustry: vueJobData.companyIndustry,
    companyScale: vueJobData.companyScale,
    title: textOf(detailBox, '.job-detail-info .job-name'),
    salary:
      vueJobData.salaryDesc ||
      textOf(detailBox, '.job-detail-info .job-salary'),
    tags: collectTags(detailBox),
    recruiter: textOf(detailBox, '.boss-info-attr'),
    recruiterActive: textOf(detailBox, '.job-boss-info .boss-active-time'),
    description:
      detailBox.querySelector<HTMLElement>('.desc')?.innerText.trim() ?? '',
    address: textOf(detailBox, '.job-address-desc'),
    url,
  };
};

export { parseSelectedJd };
