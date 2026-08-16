// # 提示词公共片段：HR 信息与简历的统一拼接段
import type { HrInfo } from '@/shared/zod';

// HR 信息段：有值时拼入提示词，标题为空时省略括号
const hrSectionOf = (hr?: HrInfo): string => {
  if (hr === undefined) {
    return '';
  }
  const title = hr.bossTitle !== '' ? `（${hr.bossTitle}）` : '';
  return `招聘者：${hr.bossName}${title} · ${hr.brandName}`;
};

// 简历段：有简历时拼入提示词
const resumeSectionOf = (resumeText?: string): string =>
  resumeText !== undefined && resumeText !== ''
    ? `用户简历：\n${resumeText}`
    : '';

export { hrSectionOf, resumeSectionOf };
