// # AI 回复生成：结合 JD、HR 信息、简历与聊天记录生成求职者的下一条回复
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ReplyMessage,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';
import { hrSectionOf, resumeSectionOf } from './prompt-parts';

// 回复系统提示默认文案：以求职者本人身份延续对话，未配置时使用
const DEFAULT_REPLY_SYSTEM =
  '你是求职者本人，正在招聘平台与招聘者沟通。根据职位信息和聊天记录，生成你下一条要发送的消息。只输出消息正文本身，不要解释、不要引号、不要加称呼前缀。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_REPLY_TASK =
  '根据职位信息和下面的聊天记录，生成求职者下一条回复。';
const DEFAULT_REPLY_REQUIREMENT =
  '要求：结合职位匹配点与对话上下文自然回应；招聘者有明确问题时直接作答；对话尚无招聘者回复时，礼貌追问以推进沟通；80~150 字。';

// 聊天记录的结构化文本：逐条标注说话方
const transcriptOf = (messages: ReplyMessage[]): string =>
  messages
    .map(({ role, text }) => `${role === 'friend' ? '招聘者' : '我'}：${text}`)
    .join('\n');

// 拼用户提示：配置文案 + 职位信息 + HR 与简历（有则带上）+ 对话上下文
const replyPromptOf = (
  jd: ReplyJd,
  messages: ReplyMessage[],
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
    jd.salary !== '' ? `薪资：${jd.salary}` : '',
    jd.description !== '' ? `职位描述：${jd.description}` : '',
    hrSectionOf(hr),
    resumeSectionOf(resumeText),
    '',
    '聊天记录：',
    transcriptOf(messages),
  ]
    .filter((line) => line !== '')
    .join('\n');

// 用所选厂商与模型生成下一条回复：读取全局提示词配置与简历，未配置时用默认文案
const generateReply = async ({
  jd,
  messages,
  vendor,
  modelId,
  thinkingMode = 'default',
  hr,
  requestPermission = true,
}: {
  jd: ReplyJd; // 目标职位信息
  messages: ReplyMessage[]; // 聊天记录，按时间正序
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  hr?: HrInfo; // 当前会话的 HR 信息
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  const system = preference.replySystem ?? DEFAULT_REPLY_SYSTEM;
  const task = preference.replyTask ?? DEFAULT_REPLY_TASK;
  const requirement = preference.replyRequirement ?? DEFAULT_REPLY_REQUIREMENT;
  return chatWithVendor({
    vendor,
    modelId,
    system,
    prompt: replyPromptOf(jd, messages, task, requirement, hr, resume?.content),
    thinkingMode,
    source: 'reply',
    promptTask: task,
    promptRequirement: requirement,
    resumeText: resume?.content,
    requestPermission,
  });
};

export {
  DEFAULT_REPLY_REQUIREMENT,
  DEFAULT_REPLY_SYSTEM,
  DEFAULT_REPLY_TASK,
  generateReply,
};
