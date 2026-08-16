// # AI 打招呼生成：拼提示词并调用所选厂商模型，供侧边栏与后台共用
import { aiPreferenceStore } from '@/shared/infra/storage';
import type { AiVendorRecord, RecordedJd, ThinkingMode } from '@/shared/zod';

import { chatWithVendor } from './vendor-client';

// 打招呼生成的系统提示：限定角色与输出形态
const GREETING_SYSTEM =
  '你是资深求职教练，帮求职者撰写发给招聘者的打招呼消息。只输出消息正文本身，不要解释、不要引号。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_GREETING_TASK =
  '根据下面职位信息，写一段求职者发给招聘者的打招呼消息。';
const DEFAULT_GREETING_REQUIREMENT =
  '要求：突出与职位方向的匹配和诚意，语气自然礼貌，80~120 字，结尾表达希望进一步沟通。';

// 由职位信息拼用户提示：配置的任务/要求文案 + 职位字段行，规模/行业有值时一并带上
const greetingPromptOf = (
  jd: RecordedJd,
  task: string,
  requirement: string,
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
  ]
    .filter((line) => line !== '')
    .join('\n');

// 用所选厂商与模型生成打招呼消息：读取全局提示词配置，未配置时用默认文案
const generateGreeting = async ({
  jd,
  vendor,
  modelId,
  thinkingMode = 'default',
}: {
  jd: RecordedJd; // 目标职位
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const task = preference.greetingTask ?? DEFAULT_GREETING_TASK;
  const requirement =
    preference.greetingRequirement ?? DEFAULT_GREETING_REQUIREMENT;
  return chatWithVendor({
    vendor,
    modelId,
    system: GREETING_SYSTEM,
    prompt: greetingPromptOf(jd, task, requirement),
    thinkingMode,
    source: 'greeting',
  });
};

export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_TASK,
  generateGreeting,
};
