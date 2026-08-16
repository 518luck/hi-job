// # AI 跟进问候生成：已读不回/未读时，结合 JD、HR、简历与已发送的打招呼语生成提醒问候
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';
import { hrSectionOf, resumeSectionOf } from './prompt-parts';

// 跟进问候系统提示默认文案：限定角色与输出形态，未配置时使用
const DEFAULT_FOLLOW_UP_SYSTEM =
  '你是资深求职教练，帮求职者给已读不回或尚未查看消息的招聘者发送一句礼貌的提醒问候。只输出消息正文本身，不要解释、不要引号。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_FOLLOW_UP_TASK =
  '根据职位信息、招聘者信息和已发送的打招呼消息，写一段提醒招聘者的问候。';
const DEFAULT_FOLLOW_UP_REQUIREMENT =
  '要求：礼貌提醒自己此前已打招呼，表达对岗位的持续兴趣，自然引出进一步沟通，80~120 字。';

// 由会话信息拼用户提示：配置文案 + 职位字段 + HR 与简历（有则带上）+ 已发送的打招呼语句
const followUpPromptOf = (
  jd: ReplyJd,
  task: string,
  requirement: string,
  greeting: string,
  hr?: HrInfo,
  resumeText?: string,
): string =>
  [
    task,
    requirement,
    '',
    `职位名称：${jd.title}`,
    `公司：${jd.companyName}`,
    hrSectionOf(hr),
    resumeSectionOf(resumeText),
    '',
    `已发送的打招呼消息：\n${greeting}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

// 用所选厂商与模型生成提醒问候：读取全局提示词配置与简历，未配置时用默认文案
const generateFollowUp = async ({
  jd,
  hr,
  greeting,
  vendor,
  modelId,
  thinkingMode = 'default',
  requestPermission = true,
}: {
  jd: ReplyJd; // 会话关联职位信息
  hr?: HrInfo; // 当前会话的 HR 信息
  greeting: string; // 已发送的打招呼语句
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  const system = preference.followUpSystem ?? DEFAULT_FOLLOW_UP_SYSTEM;
  const task = preference.followUpTask ?? DEFAULT_FOLLOW_UP_TASK;
  const requirement =
    preference.followUpRequirement ?? DEFAULT_FOLLOW_UP_REQUIREMENT;
  return chatWithVendor({
    vendor,
    modelId,
    system,
    prompt: followUpPromptOf(
      jd,
      task,
      requirement,
      greeting,
      hr,
      resume?.content,
    ),
    thinkingMode,
    source: 'followUp',
    promptTask: task,
    promptRequirement: requirement,
    requestPermission,
  });
};

export {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  generateFollowUp,
};
