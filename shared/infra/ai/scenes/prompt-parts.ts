// # 提示词公共片段：HR/简历段与场景提示词的统一拼接
import type { HrInfo, ScenePrompt } from '@/shared/zod';

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

// 统一拼提示词文本：任务/要求 + 完整职位字段 + HR/简历 + 差异段，空段剔除
const assemblePromptText = ({
  task,
  requirement,
  jd,
  hr,
  resumeText,
  sections = [],
}: ScenePrompt): string =>
  [
    task,
    requirement,
    '',
    `职位名称：${jd.title}`,
    `公司：${jd.companyName}`,
    jd.companyScale !== '' ? `公司规模：${jd.companyScale}` : '',
    jd.companyIndustry !== '' ? `公司行业：${jd.companyIndustry}` : '',
    jd.salary !== '' ? `薪资：${jd.salary}` : '',
    jd.description !== '' ? `职位描述：${jd.description}` : '',
    hrSectionOf(hr),
    resumeSectionOf(resumeText),
    ...sections,
  ]
    .filter((line) => line !== '')
    .join('\n');

export { assemblePromptText, hrSectionOf, resumeSectionOf };
