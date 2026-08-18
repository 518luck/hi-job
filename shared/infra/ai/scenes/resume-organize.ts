// # AI 简历梳理：清理 docx 转换噪音并结构化，只重组不创作，原件备份由调用方负责
import { resumeStore } from '@/shared/infra/storage';
import type { AiVendorRecord, ThinkingMode } from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';

// 梳理系统提示固定文案：角色红线为禁止虚构（功能性 prompt，不进用户可配置体系）
const DEFAULT_RESUME_ORGANIZE_SYSTEM =
  '你是简历整理助手。你的工作只限于重组与提炼求职者已有的简历内容：删除格式转换噪音、调整结构、提炼既有事实的重点。严禁虚构任何经历、技能、公司、职位、时间或数字；原文没有的信息一律不写。';

// 梳理任务默认文案
const DEFAULT_RESUME_ORGANIZE_TASK =
  '将「求职者简历」区的原文梳理为结构清晰的 Markdown：依次为基本信息、核心技能、工作经历亮点（倒序）、项目或成果亮点、求职方向；清除格式转换噪音（表格残留、页眉页脚、重复空行、无意义符号）。';

// 梳理生成要求默认文案
const DEFAULT_RESUME_ORGANIZE_REQUIREMENT =
  '只输出梳理后的简历正文，不输出解释或分析过程；所有事实一律来自原文，不得改写语义、不得补写不存在的内容、不得省略关键信息（公司、职位、时间、成果数据）；保持 Markdown 标题层级，语言与原文一致。';

// 用所选厂商与模型梳理简历：读库中简历全文，返回结构化 Markdown
const generateOrganizedResume = async ({
  vendor,
  modelId,
  thinkingMode = 'default',
  requestPermission = true,
}: {
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
  const resume = await resumeStore.readResume();
  if (resume === undefined) {
    throw new Error('请先上传简历');
  }
  return chatWithVendor({
    source: 'resumeOrganize',
    vendor,
    modelId,
    system: DEFAULT_RESUME_ORGANIZE_SYSTEM,
    thinkingMode,
    requestPermission,
    // 结构化提示词：纯简历场景，无职位与 HR 信息
    prompt: {
      task: DEFAULT_RESUME_ORGANIZE_TASK,
      requirement: DEFAULT_RESUME_ORGANIZE_REQUIREMENT,
      resumeText: resume.content,
    },
  });
};

export {
  DEFAULT_RESUME_ORGANIZE_REQUIREMENT,
  DEFAULT_RESUME_ORGANIZE_SYSTEM,
  DEFAULT_RESUME_ORGANIZE_TASK,
  generateOrganizedResume,
};
