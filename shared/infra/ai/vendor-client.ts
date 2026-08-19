// # AI 厂商客户端：构造 AI SDK 供应商实例、模型列表拉取与文本生成（一次性/流式）
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModelUsage } from 'ai';
import { generateText, streamText } from 'ai';

import type {
  AiLogSource,
  AiStreamUsage,
  AiVendorRecord,
  ScenePrompt,
  ThinkingMode,
} from '@/shared/zod';

import { recordAiLog, type ThinkingArgs } from './ai-log';
import { assemblePromptText } from './scenes/prompt-parts';

// 未授权错误标记：后台报错与聊天窗「去授权」按钮的跨世界约定，双方共用同一常量
const AUTH_ERROR_MARKER = '未授权访问 AI 厂商地址';

// 流式回调：传入 chatWithVendor 即走流式生成，思考与正文增量逐块回调、中止信号透传底层 SDK
interface AiStreamCallbacks {
  onChunk: (delta: string) => void; // 正文增量回调
  onReasoning?: (delta: string) => void; // 思考增量回调：模型未产出思考时不会触发
  onUsage?: (usage: AiStreamUsage) => void; // 用量上报回调：供应商未上报时不会触发
  abortSignal: AbortSignal; // 取消信号，中止在途生成
}

// 厂商连接参数：表单尚未保存时也可直接用于测试连接与拉取
interface VendorConnection {
  baseUrl: string; // API 基础地址
  apiKey: string; // API 密钥
  apiFormat: 'openai' | 'anthropic'; // API 协议格式
}

// 构造厂商的 AI SDK 供应商实例：后续对话、JD 分析等调用统一走此入口
const createVendorClient = ({
  name,
  baseUrl,
  apiKey,
  apiFormat,
}: VendorConnection & { name: string }) => {
  if (apiFormat === 'anthropic') {
    return createAnthropic({ baseURL: baseUrl, apiKey });
  }
  return createOpenAICompatible({ name, baseURL: baseUrl, apiKey });
};

// 请求目标地址的跨域访问权限：须在用户手势（按钮点击）内调用
const ensureOriginPermission = async ({
  baseUrl,
}: {
  baseUrl: string;
}): Promise<boolean> => {
  const origin = new URL(baseUrl).origin;
  return browser.permissions.request({ origins: [`${origin}/*`] });
};

// 判断响应体是否为 /models 接口返回的 { data: [{ id }] } 结构
const isModelsResponse = (
  body: unknown,
): body is { data: { id: unknown }[] } => {
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    return false;
  }
  return (
    Array.isArray(body.data) &&
    body.data.every(
      (item) => typeof item === 'object' && item !== null && 'id' in item,
    )
  );
};

// 拉取厂商的可用模型 id 列表：openai 兼容走 /models，anthropic 走 /v1/models
const fetchVendorModels = async ({
  baseUrl,
  apiKey,
  apiFormat,
}: VendorConnection): Promise<string[]> => {
  const granted = await ensureOriginPermission({ baseUrl });
  if (!granted) {
    throw new Error('未授权访问该地址');
  }

  const root = baseUrl.replace(/\/+$/, '');
  const modelsUrl =
    apiFormat === 'anthropic' ? `${root}/v1/models` : `${root}/models`;
  const headers: Record<string, string> =
    apiFormat === 'anthropic'
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : { Authorization: `Bearer ${apiKey}` };

  const response = await fetch(modelsUrl, { headers });
  if (!response.ok) {
    throw new Error(`接口返回 HTTP ${response.status}`);
  }

  const body: unknown = await response.json();
  if (!isModelsResponse(body)) {
    throw new Error('接口响应不是预期的模型列表结构');
  }
  return body.data
    .map((item) => String(item.id).trim())
    .filter((id) => id !== '');
};

// 思考档位 → AI SDK 调用参数：默认不传任何参数；关闭对 openai 兼容补传 thinking disabled
// （DeepSeek 思考默认开启，SDK 的 reasoning:'none' 只做到不传 effort，关不掉）；低/中/高走 SDK 统一 reasoning
const resolveThinkingArgs = (
  apiFormat: 'openai' | 'anthropic',
  mode: ThinkingMode,
): ThinkingArgs => {
  if (mode === 'default') {
    return {};
  }
  if (mode === 'off') {
    return apiFormat === 'anthropic'
      ? { reasoning: 'none' }
      : {
          providerOptions: {
            'openai-compatible': { thinking: { type: 'disabled' } },
          },
        };
  }
  return { reasoning: mode };
};

// > 用厂商配置与指定模型跑一次文本生成：收结构化提示词，内部拼平并清洗日志字段；先申请跨域权限
const chatWithVendor = async ({
  vendor,
  modelId,
  system,
  prompt,
  thinkingMode = 'default',
  source,
  requestPermission = true,
  stream,
}: {
  vendor: AiVendorRecord; // 厂商配置记录
  modelId: string; // 本次调用使用的模型 id
  system: string; // 系统提示
  prompt: ScenePrompt; // 结构化场景提示词（素材），文本与日志字段由此推导
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  source: AiLogSource; // 调用来源（打招呼/聊天页回复），写入日志
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
  stream?: AiStreamCallbacks; // 流式回调：传入时逐块推送而非一次性返回全文
}): Promise<string> => {
  // 拼平提示词文本：发送给模型的实际内容，同时记入日志 promptText 字段
  const promptText = assemblePromptText(prompt);
  const resolvedArgs = resolveThinkingArgs(vendor.apiFormat, thinkingMode);
  const startedAt = Date.now();
  // 日志公共字段：成功/失败两分支共用，只在此处写一份（直接存原生素材）
  const logEntry = {
    source,
    vendor,
    modelId,
    thinkingMode,
    resolvedArgs,
    system,
    prompt,
    promptText,
    startedAt,
  };
  let result = '';
  let usage: LanguageModelUsage | undefined;
  try {
    // 权限申请失败也算一次失败调用：与生成失败统一进日志
    if (requestPermission) {
      const granted = await ensureOriginPermission({ baseUrl: vendor.baseUrl });
      if (!granted) {
        throw new Error('未授权访问该厂商地址');
      }
    }
    const provider = createVendorClient({
      name: vendor.name,
      baseUrl: vendor.baseUrl,
      apiKey: vendor.apiKey,
      apiFormat: vendor.apiFormat,
    });
    // 流式：遍历 fullStream 分流回调思考与正文增量，结束取全文与用量；一次性：generateText 等待完整响应
    if (stream !== undefined) {
      const streamResult = streamText({
        model: provider(modelId),
        system,
        prompt: promptText,
        abortSignal: stream.abortSignal,
        ...resolvedArgs,
      });
      for await (const part of streamResult.fullStream) {
        if (part.type === 'reasoning-delta' && part.text !== '') {
          stream.onReasoning?.(part.text);
        } else if (part.type === 'text-delta' && part.text !== '') {
          stream.onChunk(part.text);
        }
      }
      result = (await streamResult.text).trim();
      usage = await streamResult.usage;
      // 用量上报：两项计数齐全才回调，供应商缺报时调用方收不到（对应展示省略）
      if (
        usage?.inputTokens !== undefined &&
        usage.outputTokens !== undefined
      ) {
        stream.onUsage?.({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
      }
    } else {
      const generated = await generateText({
        model: provider(modelId),
        system,
        prompt: promptText,
        ...resolvedArgs,
      });
      result = generated.text.trim();
      usage = generated.usage;
    }
  } catch (error) {
    // 主动取消：记稳定文案，跳过思考档位提示（与取消无关）
    if (stream?.abortSignal.aborted === true) {
      await recordAiLog({ ...logEntry, ok: false, error: '已取消' });
      throw new Error('已取消');
    }
    const rawMessage = error instanceof Error ? error.message : '生成失败';
    // 思考档位下失败多为模型不支持思考参数：追加可读提示，便于切回默认档
    const finalError =
      thinkingMode !== 'default'
        ? new Error(
            `${rawMessage}（该模型可能不支持思考参数，可尝试切回「默认」档）`,
          )
        : error instanceof Error
          ? error
          : new Error(rawMessage);
    await recordAiLog({
      ...logEntry,
      ok: false,
      error: finalError.message,
    });
    throw finalError;
  }
  await recordAiLog({
    ...logEntry,
    ok: true,
    output: result,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
  });
  return result;
};

export type { AiStreamCallbacks };
export {
  AUTH_ERROR_MARKER,
  chatWithVendor,
  createVendorClient,
  fetchVendorModels,
};
