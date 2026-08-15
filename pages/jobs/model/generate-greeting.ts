// # AI 打招呼生成：拼提示词并调用所选厂商模型
import { chatWithVendor } from '@/infra/ai';
import type { AiVendorRecord, RecordedJd } from '@/infra/storage';

// 打招呼生成的系统提示：限定角色与输出形态
const GREETING_SYSTEM =
  '你是资深求职教练，帮求职者撰写发给招聘者的打招呼消息。只输出消息正文本身，不要解释、不要引号。';

// 由职位信息拼用户提示：给出匹配点、语气与字数约束
const greetingPromptOf = (jd: RecordedJd): string =>
  [
    '根据下面职位信息，写一段求职者发给招聘者的打招呼消息。',
    '要求：突出与职位方向的匹配和诚意，语气自然礼貌，80~120 字，结尾表达希望进一步沟通。',
    '',
    `职位名称：${jd.title}`,
    `公司：${jd.companyName}`,
    `薪资：${jd.salary}`,
    `职位描述：${jd.description}`,
  ].join('\n');

// 用所选厂商与模型生成打招呼消息
const generateGreeting = async ({
  jd,
  vendor,
  modelId,
}: {
  jd: RecordedJd; // 目标职位
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
}): Promise<string> =>
  chatWithVendor({
    vendor,
    modelId,
    system: GREETING_SYSTEM,
    prompt: greetingPromptOf(jd),
  });

export { generateGreeting };
