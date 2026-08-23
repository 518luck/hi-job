// # AI 打招呼生成：结合 JD、HR 信息与简历拼提示词，调用所选厂商模型
import {
  aiPreferenceStore,
  resumeStore,
  resumeSupplementStore,
} from '@/shared/infra/storage';
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
const DEFAULT_GREETING_TASK =
  '生成首次联系当前招聘者的打招呼消息。消息在招聘者后台列表中通常被截断，只显示开头 20～30 字，对方是否点开取决于开头。';
const DEFAULT_GREETING_REQUIREMENT = [
  '第一句是能力宣言：从职位名称与职位标签中取岗位最看重的核心词直接声明，如全栈岗写“精通全栈开发，熟练掌握前后端开发流程”，其他方向替换为对应核心词；不得以“您好”“你好”等问候语或“看到贵司在招聘”“对该职位很感兴趣”等客套开场，年限不足、技术栈不符等差距不主动提，简历未明确写明的工作年限不推算、不编造。',
  '宣言后用 1～2 个与职位最相关的具体经历或成果支撑，落到做过什么、做到什么结果；与个人项目同等相关时优先写正式工作经历，不复述职位描述、不罗列技术栈清单，职位未点名的技术细节与生僻业务模块、框架、库名不写。',
  '末句简短收尾表达沟通意愿；全文 2～3 句、80～120 字，礼貌通过措辞体现，不使用“本人”“贵公司”“贵司”等生硬套话。',
  '没有简历依据时，支撑句改为围绕岗位方向直接说明相关积累与求职意向，不强行声称匹配。',
].join('\n');

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
  const supplement = await resumeSupplementStore.readResumeSupplement();
  return chatWithVendor({
    source: 'greeting',
    vendor,
    modelId,
    system: preference.greetingSystem ?? DEFAULT_GREETING_SYSTEM,
    thinkingMode,
    requestPermission,
    stream,
    // 结构化提示词：完整职位字段 + HR/简历/简历外补充，文本与日志字段由 chatWithVendor 内部推导
    prompt: {
      task: preference.greetingTask ?? DEFAULT_GREETING_TASK,
      requirement:
        preference.greetingRequirement ?? DEFAULT_GREETING_REQUIREMENT,
      jd,
      hr,
      resumeText: resume?.content,
      // 简历外补充：未录入或空串时不传字段，非空才注入
      ...(supplement?.content ? { supplementText: supplement.content } : {}),
    },
  });
};

export {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  generateGreeting,
};
