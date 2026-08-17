// # AI 打招呼生成：结合 JD、HR 信息与简历拼提示词，调用所选厂商模型
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';
import { hrSectionOf, resumeSectionOf } from './prompt-parts';

// 打招呼系统提示默认文案：限定角色与输出形态，未配置时使用
const DEFAULT_GREETING_SYSTEM =
  '你是资深求职教练，帮求职者撰写发给招聘者的打招呼消息。只输出消息正文本身，不要解释、不要引号。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_GREETING_TASK =
  '根据下面职位信息，写一段求职者发给招聘者的打招呼消息。';
const DEFAULT_GREETING_REQUIREMENT =
  '要求：突出与职位方向的匹配和诚意，语气自然礼貌，80~120 字，结尾表达希望进一步沟通。';

// 由职位信息拼用户提示：配置的任务/要求文案 + 职位字段 + HR 信息与简历（有则带上）
const greetingPromptOf = (
  jd: ReplyJd,
  task: string,
  requirement: string,
  hr?: HrInfo,
  resumeText?: string,
): string =>
  [
    task,
    requirement,
    '',
    `职位名称：${jd.title}`,
    `公司：${jd.companyName}`,
    jd.companyScale !== '' ? `公司规模：${jd.companyScale}` : '',
    jd.companyIndustry !== '' ? `公司行业：${jd.companyIndustry}` : '',
    `薪资：${jd.salary}`,
    `职位描述：${jd.description}`,
    hrSectionOf(hr),
    resumeSectionOf(resumeText),
  ]
    .filter((line) => line !== '')
    .join('\n');

// 用所选厂商与模型生成打招呼消息：读取全局提示词配置与简历，未配置时用默认文案
const generateGreeting = async ({
  jd,
  vendor,
  modelId,
  thinkingMode = 'default',
  hr,
  requestPermission = true,
}: {
  jd: ReplyJd; // 目标职位（完整或最小字段均可）
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  hr?: HrInfo; // HR 信息，工作台场景通常没有
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  const system = preference.greetingSystem ?? DEFAULT_GREETING_SYSTEM;
  const task = preference.greetingTask ?? DEFAULT_GREETING_TASK;
  const requirement =
    preference.greetingRequirement ?? DEFAULT_GREETING_REQUIREMENT;
  return chatWithVendor({
    vendor,
    modelId,
    system,
    prompt: greetingPromptOf(jd, task, requirement, hr, resume?.content),
    thinkingMode,
    source: 'greeting',
    promptTask: task,
    promptRequirement: requirement,
    resumeText: resume?.content,
    jd,
    requestPermission,
  });
};

export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  generateGreeting,
};
