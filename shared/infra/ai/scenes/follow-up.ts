// # AI 跟进消息生成：招聘沟通暂时中断时，结合 JD、HR、简历与聊天记录自然续聊
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ReplyMessage,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from '../vendor-client';
import { transcriptSectionOf } from './prompt-parts';

// 跟进系统提示默认文案：承接中断的招聘沟通，未配置时使用
const DEFAULT_FOLLOW_UP_SYSTEM =
  '你是求职者本人的求职沟通助手。请代求职者以第一人称撰写一条可直接发送的跟进消息，让暂时中断的招聘沟通自然继续。只输出消息正文，不输出标题、解释、分析过程、引号、称呼前缀或占位符。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_FOLLOW_UP_TASK =
  '结合目标职位和当前聊天记录，生成求职者下一条跟进消息。';
const DEFAULT_FOLLOW_UP_REQUIREMENT =
  '优先承接聊天中最近一个仍待招聘者回应的具体问题、材料或下一步；没有明确待回应事项时，简短询问岗位进展或后续安排。不要重复此前的打招呼、自我介绍或已表达的信息，不提“已读”“未读”“怎么没回复”，不责备、不催促。语气自然、克制、礼貌，控制在 40～80 字。';

// 用所选厂商与模型生成跟进消息：读取全局提示词配置与简历，未配置时用默认文案
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
  messages: ReplyMessage[]; // 当前页面已加载的最近聊天记录，按时间正序
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
    // 结构化提示词：完整职位字段 + HR/简历 + 当前页面最近聊天记录，跟进最近对话
    prompt: {
      task: preference.followUpTask ?? DEFAULT_FOLLOW_UP_TASK,
      requirement:
        preference.followUpRequirement ?? DEFAULT_FOLLOW_UP_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
      sections: [transcriptSectionOf(messages)],
    },
  });
};

export {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  generateFollowUp,
};
