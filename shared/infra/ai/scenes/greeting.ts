// # AI 打招呼生成：结合 JD、HR 信息与简历拼提示词，调用所选厂商模型
import { aiPreferenceStore, resumeStore } from '@/shared/infra/storage';
import type {
  AiVendorRecord,
  HrInfo,
  ReplyJd,
  ThinkingMode,
} from '@/shared/zod';

import { type AiStreamCallbacks, chatWithVendor } from '../vendor-client';

// 打招呼系统提示默认文案：限定角色与输出形态，未配置时使用
const DEFAULT_GREETING_SYSTEM =
  '你是求职者本人的求职沟通助手。请代求职者以第一人称撰写可直接发送给招聘者的消息。只输出消息正文，不输出标题、解释、分析过程、引号或占位符。';

// 提示词默认文案：未在「AI 厂商 → 提示词」配置时使用
const DEFAULT_GREETING_TASK = '生成首次联系当前招聘者的打招呼消息。';
const DEFAULT_GREETING_REQUIREMENT =
  '有简历依据时，只选择 1～2 个与职位最相关的经历或技能，具体说明匹配点；没有明确依据时，围绕岗位方向表达兴趣，不强行声称匹配。不要复述职位描述或堆砌技能关键词，不使用“本人”“贵公司”等生硬套话。语气自然、礼貌且有诚意，控制在 80～120 字，并以希望进一步了解岗位或沟通机会自然收尾。';

// 用所选厂商与模型生成打招呼消息：读取全局提示词配置与简历，未配置时用默认文案
const generateGreeting = async ({
  jd,
  vendor,
  modelId,
  thinkingMode = 'default',
  hr,
  requestPermission = true,
  stream,
}: {
  jd: ReplyJd; // 目标职位（完整或最小字段均可）
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  hr?: HrInfo; // HR 信息，工作台场景通常没有
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
  stream?: AiStreamCallbacks; // 流式回调：传入时逐块推送而非一次性返回
}): Promise<string> => {
  const preference = await aiPreferenceStore.readAiPreference();
  const resume = await resumeStore.readResume();
  return chatWithVendor({
    source: 'greeting',
    vendor,
    modelId,
    system: preference.greetingSystem ?? DEFAULT_GREETING_SYSTEM,
    thinkingMode,
    requestPermission,
    stream,
    // 结构化提示词：完整职位字段 + HR/简历，文本与日志字段由 chatWithVendor 内部推导
    prompt: {
      task: preference.greetingTask ?? DEFAULT_GREETING_TASK,
      requirement:
        preference.greetingRequirement ?? DEFAULT_GREETING_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
    },
  });
};

export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  generateGreeting,
};
