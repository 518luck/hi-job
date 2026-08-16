// # Window RPC 方法表：主世界与隔离世界之间的远程调用类型

import type { ProtocolMap } from '@/shared/infra/messaging';

import type { VueJobCard, VueJobData } from './vue-job-data';

// 后台直通调用：method 为扩展消息名，桥不逐方法登记、原样转发
interface BackgroundCallInput {
  method: keyof ProtocolMap; // ProtocolMap 消息名
  data: unknown; // 消息参数
}

// Window RPC 方法映射：input 为请求参数，output 为远程返回值
interface WindowMethodMap {
  'background.call': { input: BackgroundCallInput; output: unknown };
  'vue.getCurrentJob': { input: undefined; output: VueJobData };
  'vue.getJobCards': {
    input: undefined;
    output: Record<string, VueJobCard>;
  };
}

export type { BackgroundCallInput, WindowMethodMap };
