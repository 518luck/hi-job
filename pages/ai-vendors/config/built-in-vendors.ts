// # 内置厂商预设：点击芯片预填表单，密钥由用户补充，所有字段均可修改

// 内置厂商预设结构：作为表单初始值使用，不直接落库
interface BuiltInVendor {
  key: string; // 预设唯一标识
  name: string; // 厂商名称
  baseUrl: string; // API 基础地址
  apiFormat: 'openai' | 'anthropic'; // API 协议格式
  models: string[]; // 预填的默认模型 id，可用「拉取模型列表」覆盖为真实值
}

// 内置厂商清单：覆盖国内外主流服务，模型名为常见默认值、仅供参考
const BUILT_IN_VENDORS: BuiltInVendor[] = [
  {
    key: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiFormat: 'openai',
    models: ['glm-4.7', 'glm-4.6', 'glm-4.5-air'],
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiFormat: 'openai',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    key: 'moonshot',
    name: 'Kimi（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiFormat: 'openai',
    models: ['kimi-k2-0905-preview', 'kimi-k2-turbo-preview'],
  },
  {
    key: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiFormat: 'openai',
    models: ['qwen3-max', 'qwen-plus', 'qwen-turbo'],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiFormat: 'openai',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4o'],
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiFormat: 'anthropic',
    models: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5'],
  },
];

export type { BuiltInVendor };
export { BUILT_IN_VENDORS };
