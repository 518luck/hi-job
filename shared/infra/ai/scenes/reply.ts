// # AI 回复生成：结合 JD、HR 信息、简历与聊天记录生成求职者的下一条回复
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

// 回复系统提示默认文案：以求职者本人身份延续对话，未配置时使用
const DEFAULT_REPLY_SYSTEM =
  '你是求职者本人的求职沟通助手。请代求职者以第一人称延续与招聘者的对话，生成一条可直接发送的回复。只输出消息正文，不输出标题、解释、分析过程、引号、称呼前缀或占位符。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_REPLY_TASK =
  '结合目标职位、求职者简历和聊天记录，生成求职者下一条回复。';
const DEFAULT_REPLY_REQUIREMENT =
  '以招聘者的最新消息为中心：有一个或多个明确问题时逐一直接回答；材料没有具体答案时，不代替求职者编造，可用不承诺具体值的自然表达继续沟通。不要重新自我介绍，不重复已经说过的内容；回答后只在有助于推进沟通时补充一个最相关的问题或下一步。若招聘者尚未回复，则承接求职者最后一条消息礼貌追问，不重复原话。语气真诚、简洁、口语化，控制在 80～150 字。';

// 用所选厂商与模型生成下一条回复：读取全局提示词配置与简历，未配置时用默认文案
const generateReply = async ({
  jd,
  messages,
  vendor,
  modelId,
  thinkingMode = 'default',
  hr,
  requestPermission = true,
  stream,
}: {
  jd: ReplyJd; // 目标职位信息
  messages: ReplyMessage[]; // 聊天记录，按时间正序
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
    source: 'reply',
    vendor,
    modelId,
    system: preference.replySystem ?? DEFAULT_REPLY_SYSTEM,
    thinkingMode,
    requestPermission,
    stream,
    // 结构化提示词：完整职位字段 + HR/简历 + 聊天记录，文本与日志字段由 chatWithVendor 内部推导
    prompt: {
      task: preference.replyTask ?? DEFAULT_REPLY_TASK,
      requirement: preference.replyRequirement ?? DEFAULT_REPLY_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
      sections: [transcriptSectionOf(messages)],
    },
  });
};

export {
  DEFAULT_REPLY_REQUIREMENT,
  DEFAULT_REPLY_SYSTEM,
  DEFAULT_REPLY_TASK,
  generateReply,
};
