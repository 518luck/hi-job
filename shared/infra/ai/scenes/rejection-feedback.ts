// # AI 请教反馈生成：招聘流程结束后，结合完整职位、HR、简历与聊天记录生成反馈请求
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ReplyMessage,
  ThinkingMode,
} from '@/shared/zod';

import { type AiStreamCallbacks, chatWithVendor } from '../vendor-client';
import { transcriptSectionOf } from './prompt-parts';

// 请教反馈的系统提示默认文案：接受结果并低负担地请教改进方向
const DEFAULT_REJECTION_FEEDBACK_SYSTEM =
  '你是求职者本人的求职沟通助手。招聘流程明确结束后，请代求职者以第一人称撰写一条可直接发送的反馈请求。只输出消息正文，不输出标题、解释、分析过程、引号、称呼前缀或占位符。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_REJECTION_FEEDBACK_TASK =
  '根据当前职位和最近聊天记录，在尊重招聘结果的前提下，请教本次未能继续推进的关键不匹配点或一项可改进建议。';
const DEFAULT_REJECTION_FEEDBACK_REQUIREMENT =
  '先接受并感谢对方告知，不争辩、不挽留、不证明自己其实匹配。对方尚未说明具体原因时，用“若方便”请教一个关键不匹配点或一项改进建议；已经说明原因时，不重复追问，只可进一步请教一项可执行的改进建议。明确表达不方便回复也没关系，不使用“为什么拒绝我”“为什么不要我”等质问式措辞，不复述职位描述，不虚构招聘者评价。语气真诚、克制，控制在 40～70 字。';

// 用所选厂商与模型生成反馈请求：读取全局提示词配置与简历，未配置时用默认文案
const generateRejectionFeedback = async ({
  jd,
  messages,
  vendor,
  modelId,
  thinkingMode = 'default',
  hr,
  requestPermission = true,
  stream,
}: {
  jd: ReplyJd; // 目标职位（完整或最小字段均可）
  messages: ReplyMessage[]; // 最近聊天记录
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  hr?: HrInfo; // 当前会话的 HR 信息
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
  stream?: AiStreamCallbacks; // 流式回调：传入时逐块推送而非一次性返回
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  return chatWithVendor({
    source: 'rejectionFeedback',
    vendor,
    modelId,
    system:
      preference.rejectionFeedbackSystem ?? DEFAULT_REJECTION_FEEDBACK_SYSTEM,
    thinkingMode,
    requestPermission,
    stream,
    // 结构化提示词：完整职位字段 + HR/简历 + 最近聊天记录
    prompt: {
      task: preference.rejectionFeedbackTask ?? DEFAULT_REJECTION_FEEDBACK_TASK,
      requirement:
        preference.rejectionFeedbackRequirement ??
        DEFAULT_REJECTION_FEEDBACK_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
      sections: [transcriptSectionOf(messages)],
    },
  });
};

export {
  DEFAULT_REJECTION_FEEDBACK_REQUIREMENT,
  DEFAULT_REJECTION_FEEDBACK_SYSTEM,
  DEFAULT_REJECTION_FEEDBACK_TASK,
  generateRejectionFeedback,
};
