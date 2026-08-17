// # AI 跟进问候生成：聊过一段时间后对方突然不回复时，结合 JD、HR、简历与聊天记录生成提醒
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ReplyMessage,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';
import { transcriptOf } from './prompt-parts';

// 跟进问候系统提示默认文案：明确这是一条「提醒」、承接最近对话，未配置时使用
const DEFAULT_FOLLOW_UP_SYSTEM =
  '你是资深求职教练。招聘者与求职者聊了一段时间后突然不再回复，你帮求职者写一句自然的提醒，把对话重新拉回正轨。只输出消息正文本身，不要解释、不要引号。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_FOLLOW_UP_TASK =
  '根据职位信息、招聘者信息和下方聊天记录，提醒招聘者继续沟通。';
const DEFAULT_FOLLOW_UP_REQUIREMENT =
  '要求：自然承接最近一次对话（不要重复已经说过的内容），温和表达还在等对方回应、希望继续推进沟通，80~120 字。';

// 用所选厂商与模型生成提醒问候：读取全局提示词配置与简历，未配置时用默认文案
const generateFollowUp = async ({
  jd,
  hr,
  messages,
  vendor,
  modelId,
  thinkingMode = 'default',
  requestPermission = true,
}: {
  jd: ReplyJd; // 会话关联职位信息
  hr?: HrInfo; // 当前会话的 HR 信息
  messages: ReplyMessage[]; // 最近聊天记录（含已发送的打招呼语）
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  return chatWithVendor({
    source: 'followUp',
    vendor,
    modelId,
    system: preference.followUpSystem ?? DEFAULT_FOLLOW_UP_SYSTEM,
    thinkingMode,
    requestPermission,
    // 结构化提示词：完整职位字段 + HR/简历 + 完整聊天记录（含打招呼），提醒承接最近对话
    prompt: {
      task: preference.followUpTask ?? DEFAULT_FOLLOW_UP_TASK,
      requirement:
        preference.followUpRequirement ?? DEFAULT_FOLLOW_UP_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
      sections: [`聊天记录：\n${transcriptOf(messages)}`],
    },
  });
};

export {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  generateFollowUp,
};
