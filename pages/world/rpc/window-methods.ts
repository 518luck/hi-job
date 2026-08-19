// # Window RPC 方法表：主世界与隔离世界之间的远程调用类型

import type { ProtocolMap } from '@/shared/infra/messaging';
import type { ChatContext, VueJobCard, VueJobData } from '@/shared/zod';

// 后台直通调用：method 为扩展消息名，桥不逐方法登记、原样转发
interface BackgroundCallInput {
  method: keyof ProtocolMap; // ProtocolMap 消息名
  data: unknown; // 消息参数
}

// Window RPC 方法映射：input 为请求参数，output 为远程返回值
// vue.getChatContext 走 vue-chat 独立命名空间：职位数据服务与聊天页服务各答各的，避免同命名空间竞争应答
interface WindowMethodMap {
  'background.call': { input: BackgroundCallInput; output: unknown };
  'vue.getCurrentJob': { input: undefined; output: VueJobData };
  'vue.getJobCards': {
    input: undefined;
    output: Record<string, VueJobCard>;
  };
  'vue.getChatContext': { input: undefined; output: ChatContext | null };
}

export type { BackgroundCallInput, WindowMethodMap };
