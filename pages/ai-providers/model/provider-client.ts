// # AI 供应商客户端：AI SDK 供应商工厂与模型列表拉取
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 厂商连接参数：表单尚未保存时也可直接用于测试连接与拉取
interface ProviderConnection {
  baseUrl: string; // API 基础地址
  apiKey: string; // API 密钥
  apiFormat: 'openai' | 'anthropic'; // API 协议格式
}

// 构造厂商的 AI SDK 供应商实例：后续对话、JD 分析等调用统一走此入口
const createProviderClient = ({
  name,
  baseUrl,
  apiKey,
  apiFormat,
}: ProviderConnection & { name: string }) => {
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
const fetchProviderModels = async ({
  baseUrl,
  apiKey,
  apiFormat,
}: ProviderConnection): Promise<string[]> => {
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

export { createProviderClient, fetchProviderModels };
