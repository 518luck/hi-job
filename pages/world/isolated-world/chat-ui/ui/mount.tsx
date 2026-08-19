// # 聊天 UI 挂载（隔离世界）：Shadow Root 内渲染 React 聊天助手
import './chat-ui.css';

import { createRoot, type Root } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { ChatApp } from './chat-app';

// 挂载聊天助手：Shadow Root 隔离宿主样式，会话容器出现前组件自身保持空渲染
const startChatUi = async (ctx: ContentScriptContext): Promise<void> => {
  const ui = await createShadowRootUi(ctx, {
    name: 'hijob-chat-ui',
    position: 'inline',
    anchor: 'body',
    append: 'last',
    onMount: (container) => {
      const root = createRoot(container);
      root.render(<ChatApp />);
      return root;
    },
    onRemove: (root: Root | undefined) => {
      root?.unmount();
    },
  });
  ui.mount();
};

export { startChatUi };
