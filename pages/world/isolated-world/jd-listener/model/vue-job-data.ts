// # Vue 职位数据请求（隔离世界）：通过 Window RPC 请求主世界读取原始职位数据

import {
  createWindowRpcClient,
  WINDOW_RPC_NAMESPACE_VUE,
  type WindowMethodMap,
} from '@/pages/world/rpc';
import { debugLog } from '@/shared/lib/debug-log';
import { readProperty, stringOf } from '@/shared/lib/page-property';
import type { VueJobCard, VueJobData } from '@/shared/zod';

// 主世界 Vue 数据请求客户端：调用层只接触方法名与返回值
const vueRpc = createWindowRpcClient<
  Pick<WindowMethodMap, 'vue.getCurrentJob' | 'vue.getJobCards'>
>({ namespace: WINDOW_RPC_NAMESPACE_VUE, timeoutMs: 300 });

// 主世界请求失败时返回空数据，保留原有调用方的 DOM 回退策略
const emptyJobData = (): VueJobData => ({
  salaryDesc: '',
  companyScale: '',
  companyIndustry: '',
});

// 向主世界请求职位原始数据；薪资为空则重试
const requestVueJobData = async (): Promise<VueJobData> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const jobData = await vueRpc.call('vue.getCurrentJob', undefined);
      debugLog(`vue.getCurrentJob 第 ${attempt + 1} 次应答`, jobData);
      if (jobData.salaryDesc !== '') {
        return jobData;
      }
    } catch (error) {
      debugLog(`vue.getCurrentJob 第 ${attempt + 1} 次失败`, error);
    }
  }
  debugLog('Vue 薪资读取失败，调用方回退 DOM 文本');
  return emptyJobData();
};

// 请求整页卡片规模信息；失败回空表，由装饰器的下次页面变化重试
const requestJobCards = async (): Promise<Record<string, VueJobCard>> => {
  try {
    return await vueRpc.call('vue.getJobCards', undefined);
  } catch (error) {
    debugLog('vue.getJobCards 失败，返回空表', error);
    return {};
  }
};

// 保留兼容的安全字段读取工具，供后续协议适配扩展使用
export { readProperty, requestJobCards, requestVueJobData, stringOf };
