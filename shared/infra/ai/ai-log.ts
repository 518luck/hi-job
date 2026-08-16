// # AI 调用日志：组装日志字段并写入仓储
import { aiLogStore } from '@/shared/infra/storage';
import type { AiLogSource, AiVendorRecord, ThinkingMode } from '@/shared/zod';

// openai 兼容的思考关闭参数：DeepSeek 官方 API 的 thinking 开关字段
type ThinkingProviderOptions = {
  'openai-compatible': { thinking: { type: 'disabled' } };
};

// 思考相关的 AI SDK 调用参数：与 resolveThinkingArgs 返回值一致，日志记录实际传递内容
type ThinkingArgs = {
  reasoning?: 'none' | 'low' | 'medium' | 'high';
  providerOptions?: ThinkingProviderOptions;
};

// recordAiLog 的入参：一次 AI 调用的日志素材
interface RecordAiLogInput {
  source: AiLogSource; // 调用来源（打招呼/聊天页回复）
  vendor: AiVendorRecord; // 厂商配置记录
  modelId: string; // 本次调用使用的模型 id
  thinkingMode: ThinkingMode; // 思考模式档位
  resolvedArgs: ThinkingArgs; // 实际传递的思考参数
  system: string; // 系统提示（角色设定）
  prompt: string; // 用户提示（本次任务内容）
  promptTask?: string; // 提示词任务描述（打招呼生成时记录）
  promptRequirement?: string; // 提示词生成要求（打招呼生成时记录）
  startedAt: number; // 调用开始时间戳（毫秒）
  ok: boolean; // 调用是否成功
  output?: string; // 成功时的返回文本
  error?: string; // 失败时的错误消息
}

// 记录 AI 调用日志：写失败不影响生成主流程
const recordAiLog = async ({
  source,
  vendor,
  modelId,
  thinkingMode,
  resolvedArgs,
  system,
  prompt,
  promptTask,
  promptRequirement,
  startedAt,
  ok,
  output,
  error,
}: RecordAiLogInput): Promise<void> => {
  try {
    await aiLogStore.appendAiLog({
      createdAt: Date.now(),
      source,
      vendorName: vendor.name,
      apiFormat: vendor.apiFormat,
      modelId,
      thinkingMode,
      resolvedArgs,
      system,
      prompt,
      promptTask,
      promptRequirement,
      ok,
      durationMs: Date.now() - startedAt,
      output,
      error,
    });
  } catch {
    // 日志写入失败不影响生成主流程
  }
};

export type { ThinkingArgs };
export { recordAiLog };
