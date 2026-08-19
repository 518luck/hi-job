// # 隔离世界 slice 公有 API：聚合各领域的入口函数
// chat-ui 领域不进聚合出口：其携带 React 与 Tailwind CSS，经聚合会被拉进其他领域入口的
// 打包图（CSS 副作用无法摇树），入口直接从 '@/pages/world/isolated-world/chat-ui' 导入。

export { startJdDetailGreet } from './jd-detail-greet';
export {
  startJdRecorder,
  startJobCardBlocker,
  startJobCardChatted,
  startJobCardDecorator,
  startJobChangeWatcher,
} from './jd-listener';
export { startRuntimeBridge } from './runtime-bridge';
