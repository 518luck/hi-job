// # AI 厂商客户端：构造 AI SDK 供应商实例、模型列表拉取与文本生成
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

import type { AiVendorRecord, ThinkingMode } from '@/shared/zod';

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

// openai 兼容的思考关闭参数：DeepSeek 官方 API 的 thinking 开关字段
type ThinkingProviderOptions = {
  'openai-compatible': { thinking: { type: 'disabled' } };
};

// 思考档位 → AI SDK 调用参数：默认不传任何参数；关闭对 openai 兼容补传 thinking disabled
// （DeepSeek 思考默认开启，SDK 的 reasoning:'none' 只做到不传 effort，关不掉）；低/中/高走 SDK 统一 reasoning
const resolveThinkingArgs = (
  apiFormat: 'openai' | 'anthropic',
  mode: ThinkingMode,
): {
  reasoning?: 'none' | 'low' | 'medium' | 'high';
  providerOptions?: ThinkingProviderOptions;
} => {
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

// > 用厂商配置与指定模型跑一次文本生成：先申请跨域权限，须在用户手势（按钮点击）内调用
const chatWithVendor = async ({
  vendor,
  modelId,
  system,
  prompt,
  thinkingMode = 'default',
  requestPermission = true,
}: {
  vendor: AiVendorRecord; // 厂商配置记录
  modelId: string; // 本次调用使用的模型 id
  system: string; // 系统提示
  prompt: string; // 用户提示
  thinkingMode?: ThinkingMode; // 思考模式档位，默认不传任何思考参数
  requestPermission?: boolean; // 是否申请跨域权限；无手势环境（后台）传 false
}): Promise<string> => {
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
  try {
    const { text } = await generateText({
      model: provider(modelId),
      system,
      prompt,
      ...resolveThinkingArgs(vendor.apiFormat, thinkingMode),
    });
    return text.trim();
  } catch (error) {
    // 思考档位下失败多为模型不支持思考参数：追加可读提示，便于切回默认档
    if (thinkingMode !== 'default') {
      throw new Error(
        `${error instanceof Error ? error.message : '生成失败'}（该模型可能不支持思考参数，可尝试切回「默认」档）`,
      );
    }
    throw error;
  }
};

export { chatWithVendor, createVendorClient, fetchVendorModels };
