// # 内置厂商预设：点击芯片预填表单，密钥由用户补充，所有字段均可修改
import anthropicIcon from '@/assets/vendor-icons/anthropic.png';
import deepseekIcon from '@/assets/vendor-icons/deepseek.png';
import hunyuanIcon from '@/assets/vendor-icons/hunyuan.png';
import kimiIcon from '@/assets/vendor-icons/kimi.png';
import minimaxIcon from '@/assets/vendor-icons/minimax.png';
import openaiIcon from '@/assets/vendor-icons/openai.png';
import opencodeIcon from '@/assets/vendor-icons/opencode.png';
import qwenIcon from '@/assets/vendor-icons/qwen.png';
import volcengineIcon from '@/assets/vendor-icons/volcengine.png';
import zhipuIcon from '@/assets/vendor-icons/zhipu.png';

// 内置厂商预设结构：作为表单初始值使用，不直接落库
interface BuiltInVendor {
  key: string; // 预设唯一标识
  name: string; // 厂商名称
  baseUrl: string; // API 基础地址
  apiFormat: 'openai' | 'anthropic'; // API 协议格式
  models: string[]; // 预填的默认模型 id，可用「拉取模型列表」覆盖为真实值
  icon: string; // 厂商官网品牌图标（打包静态资源）
}

// 内置厂商清单：覆盖国内外主流服务，模型名为常见默认值、仅供参考
const BUILT_IN_VENDORS: BuiltInVendor[] = [
  {
    key: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiFormat: 'openai',
    models: ['glm-4.7', 'glm-4.6', 'glm-4.5-air'],
    icon: zhipuIcon,
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiFormat: 'openai',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    icon: deepseekIcon,
  },
  {
    key: 'moonshot',
    name: 'Kimi（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiFormat: 'openai',
    models: ['kimi-k2-0905-preview', 'kimi-k2-turbo-preview'],
    icon: kimiIcon,
  },
  {
    key: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiFormat: 'openai',
    models: ['qwen3-max', 'qwen-plus', 'qwen-turbo'],
    icon: qwenIcon,
  },
  {
    key: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    apiFormat: 'openai',
    models: ['MiniMax-H3', 'MiniMax-M2'],
    icon: minimaxIcon,
  },
  {
    key: 'hunyuan',
    name: '腾讯混元',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    apiFormat: 'openai',
    models: ['hunyuan-turbos-latest', 'hunyuan-lite'],
    icon: hunyuanIcon,
  },
  {
    key: 'volcengine',
    name: '火山方舟（豆包）',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiFormat: 'openai',
    models: ['doubao-seed-1.6'],
    icon: volcengineIcon,
  },
  {
    key: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiFormat: 'openai',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4o'],
    icon: openaiIcon,
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiFormat: 'anthropic',
    models: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5'],
    icon: anthropicIcon,
  },
  {
    key: 'opencode-go',
    name: 'OpenCode Go',
    baseUrl: 'https://opencode.ai/zen/go/v1',
    apiFormat: 'openai',
    models: [
      'glm-5.3',
      'glm-5.2',
      'glm-5.1',
      'kimi-k3',
      'kimi-k2.7-code',
      'kimi-k2.6',
      'deepseek-v4-pro',
      'deepseek-v4-flash',
      'mimo-v2.5',
      'mimo-v2.5-pro',
      'hy3',
    ],
    icon: opencodeIcon,
  },
];

export type { BuiltInVendor };
export { BUILT_IN_VENDORS };
