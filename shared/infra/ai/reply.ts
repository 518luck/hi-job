// # AI 回复生成：结合聊天记录与职位信息生成求职者的下一条回复
import type {
  AiVendorRecord,
  ReplyJd,
  ReplyMessage,
  ThinkingMode,
} from '@/shared/zod';

import { chatWithVendor } from './vendor-client';

// 回复生成的系统提示：以求职者本人身份延续对话
const REPLY_SYSTEM =
  '你是求职者本人，正在招聘平台与招聘者沟通。根据职位信息和聊天记录，生成你下一条要发送的消息。只输出消息正文本身，不要解释、不要引号、不要加称呼前缀。';

// 聊天记录的结构化文本：逐条标注说话方
const transcriptOf = (messages: ReplyMessage[]): string =>
  messages
    .map(({ role, text }) => `${role === 'friend' ? '招聘者' : '我'}：${text}`)
    .join('\n');

// 拼用户提示：职位匹配点 + 对话上下文 + 输出约束
const replyPromptOf = (jd: ReplyJd, messages: ReplyMessage[]): string =>
  [
    '根据职位信息和下面的聊天记录，生成求职者下一条回复。',
    '要求：结合职位匹配点与对话上下文自然回应；招聘者有明确问题时直接作答；',
    '对话尚无招聘者回复时，礼貌追问以推进沟通；80~150 字。',
    '',
    `职位名称：${jd.title}`,
    `公司：${jd.companyName}`,
    jd.companyScale !== '' ? `公司规模：${jd.companyScale}` : '',
    jd.companyIndustry !== '' ? `公司行业：${jd.companyIndustry}` : '',
    jd.salary !== '' ? `薪资：${jd.salary}` : '',
    jd.description !== '' ? `职位描述：${jd.description}` : '',
    '',
    '聊天记录：',
    transcriptOf(messages),
  ]
    .filter((line) => line !== '')
    .join('\n');

// 用所选厂商与模型生成下一条回复
const generateReply = async ({
  jd,
  messages,
  vendor,
  modelId,
  thinkingMode = 'default',
  requestPermission = true,
}: {
  jd: ReplyJd; // 目标职位信息
  messages: ReplyMessage[]; // 聊天记录，按时间正序
  vendor: AiVendorRecord; // 所选厂商配置
  modelId: string; // 所选模型 id
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> =>
  chatWithVendor({
    vendor,
    modelId,
    system: REPLY_SYSTEM,
    prompt: replyPromptOf(jd, messages),
    thinkingMode,
    requestPermission,
  });

export { generateReply };
