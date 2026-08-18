import { debugLog } from '@/shared/lib/debug-log';
import type { SelectedJd, VueJobData } from '@/shared/zod';

import { requestVueJobData } from './vue-job-data';

// Vue currentJob 仅在列表页有数据；详情页无该结构时用空值走 DOM 抓取
const EMPTY_VUE_JOB_DATA: VueJobData = {
  salaryDesc: '',
  companyScale: '',
  companyIndustry: '',
  brandName: '',
  bossOnline: false,
  bossActiveDesc: '',
  encryptBossId: '',
  securityId: '',
  encryptJobId: '',
  lid: '',
};

// 取第一个匹配元素的文本，找不到返回空串
const textOf = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

// 从职位详情链接中提取职位唯一 id
const jobIdOfUrl = (url: string): string => {
  const match = url.match(/\/job_detail\/([^.]+)\.html/);
  return match?.[1] ?? '';
};

// 详情容器兼容多套结构：列表页详情面板、独立详情页 banner、独立详情页正文区（banner 缺失时）
const detailBoxOf = (doc: Document): HTMLElement | null =>
  doc.querySelector<HTMLElement>('.job-detail-box') ??
  doc.querySelector<HTMLElement>('.job-primary.detail-box') ??
  doc.querySelector<HTMLElement>('.job-detail');

// 职位详情链接：查看更多信息按钮可唯一定位职位，回退为当前页地址
const jobUrlOf = (detailBox: HTMLElement, doc: Document): string =>
  detailBox.querySelector<HTMLAnchorElement>('.more-job-btn')?.href ||
  doc.location?.href ||
  '';

// 读取当前选中职位的唯一 id：来源与解析流程共用同一提取逻辑，供记录器快速判断职位是否变化
const currentJobIdOf = (doc: Document): string => {
  const detailBox = detailBoxOf(doc);
  if (detailBox === null) {
    return '';
  }
  return jobIdOfUrl(jobUrlOf(detailBox, doc));
};

// 解析公司标识与名称：列表页取选中卡片，独立详情页取侧栏公司信息，匿名时按名称聚合
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
  // 独立详情页回退：侧栏公司链接与名称
  const siderHref =
    doc
      .querySelector<HTMLAnchorElement>(
        '.sider-company .company-info a[href*="/gongsi/"]',
      )
      ?.getAttribute('href') ?? '';
  const siderId = siderHref.match(/\/gongsi\/([^.]+)\.html/);
  const siderName =
    doc
      .querySelector<HTMLElement>('.sider-company .company-info a[title]')
      ?.getAttribute('title') ?? '';

  const companyId = idMatch?.[1] ?? siderId?.[1] ?? '';
  const companyName = cardName || detailName || siderName || '未知公司';
  return {
    companyId: companyId === '' ? `anonymous:${companyName}` : companyId,
    companyName,
  };
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

// 读取侧栏公司信息文本：规模/行业文本在图标所在 <p> 内，图标元素自身无文本
const siderValueOf = (doc: Document, iconClass: string): string =>
  Array.from(doc.querySelectorAll<HTMLElement>('.sider-company p'))
    .find((p) => p.querySelector(`.${iconClass}`) !== null)
    ?.innerText.trim() ?? '';

// 从 Boss直聘 页面解析当前选中的职位（JD）；未选中任何职位时返回 null
const parseSelectedJd = async (doc: Document): Promise<SelectedJd | null> => {
  const detailBox = detailBoxOf(doc);
  if (detailBox === null) {
    return null;
  }

  // > 详情链接取自"查看更多信息"按钮，可唯一定位职位；回退为当前页地址
  const url = jobUrlOf(detailBox, doc);

  const { companyId, companyName } = parseCompany(doc);

  // 仅列表页面板请求 Vue 原始数据；详情页无 currentJob，直接走 DOM 文本避免无效重试
  const isListPanel = detailBox.classList.contains('job-detail-box');
  const vueJobData = isListPanel
    ? await requestVueJobData()
    : EMPTY_VUE_JOB_DATA;
  const salary =
    vueJobData.salaryDesc ||
    textOf(detailBox, '.job-detail-info .job-salary') ||
    textOf(detailBox, '.name .salary') ||
    textOf(doc, '.name .salary') ||
    '';
  debugLog(
    '记录薪资',
    salary,
    vueJobData.salaryDesc !== '' ? '来源 Vue' : '来源 DOM 回退',
  );

  // 公司规模/行业优先取 Vue；详情页读不到时回退侧栏公司信息
  const companyScale =
    vueJobData.companyScale || siderValueOf(doc, 'icon-scale');
  const companyIndustry =
    vueJobData.companyIndustry || siderValueOf(doc, 'icon-industry');

  // 独立详情页的字段分散在两段：banner 内标题薪资，详情区描述/招聘者/地址，
  // 因此这些字段在 banner 内查不到时回退到整个文档查找
  const tagsInBox = collectTags(detailBox);
  const descriptionText =
    detailBox.querySelector<HTMLElement>('.desc')?.innerText.trim() ??
    detailBox.querySelector<HTMLElement>('.job-sec-text')?.innerText.trim() ??
    doc.querySelector<HTMLElement>('.job-sec-text')?.innerText.trim() ??
    doc.querySelector<HTMLElement>('.desc')?.innerText.trim() ??
    '';

  return {
    jobId: jobIdOfUrl(url),
    companyId,
    companyName,
    companyIndustry,
    companyScale,
    title:
      textOf(detailBox, '.job-detail-info .job-name') ||
      textOf(detailBox, '.name h1') ||
      textOf(doc, '.name h1'),
    salary,
    tags: tagsInBox.length > 0 ? tagsInBox : collectTags(doc),
    recruiter:
      textOf(detailBox, '.boss-info-attr') || textOf(doc, '.boss-info-attr'),
    recruiterActive:
      textOf(detailBox, '.job-boss-info .boss-active-time') ||
      textOf(detailBox, '.boss-online-tag') ||
      textOf(doc, '.boss-online-tag'),
    description: descriptionText,
    address:
      textOf(detailBox, '.job-address-desc') ||
      textOf(detailBox, '.location-address') ||
      textOf(doc, '.location-address'),
    url,
  };
};

export { currentJobIdOf, parseSelectedJd };
