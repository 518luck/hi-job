// # 聊天助手应用（聊天 UI 根）：等聊天容器出现后渲染悬浮按钮与聊天窗，runtime 经 AssistantRuntimeProvider 注入视图

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  FAB_DEFAULT_BOTTOM,
  FAB_DEFAULT_LEFT,
  VIEWPORT_MARGIN,
  WINDOW_GAP,
} from '../config/chat-app';
import { CHAT_WINDOW_HEIGHT, CHAT_WINDOW_WIDTH } from '../config/chat-window';
import { useChatRuntime } from '../model/chat-runtime';
import { ChatFab, type FabPosition } from './chat-fab';
import { ChatWindow } from './chat-window';

// 判定当前是否聊天页：会话容器存在即认定（与旧版主世界注入条件一致）
const isChatPageReady = (): boolean =>
  document.querySelector('.chat-conversation') !== null;

// 聊天窗定位样式：优先按钮上方、放不下则下方；水平按按钮所在半边对齐并夹在视口内
const computeWindowStyle = (rect: DOMRect): CSSProperties => {
  const top =
    rect.top - CHAT_WINDOW_HEIGHT - WINDOW_GAP >= 0
      ? rect.top - CHAT_WINDOW_HEIGHT - WINDOW_GAP
      : rect.bottom + WINDOW_GAP;
  // 按钮在左半边时窗的左缘贴按钮左缘，在右半边时窗的右缘贴按钮右缘，均夹在视口内
  if (rect.left + rect.width / 2 < window.innerWidth / 2) {
    return {
      top,
      left: Math.min(
        Math.max(rect.left, VIEWPORT_MARGIN),
        window.innerWidth - CHAT_WINDOW_WIDTH - VIEWPORT_MARGIN,
      ),
    };
  }
  return {
    top,
    right: Math.min(
      Math.max(window.innerWidth - rect.right, VIEWPORT_MARGIN),
      window.innerWidth - CHAT_WINDOW_WIDTH - VIEWPORT_MARGIN,
    ),
  };
};

// 聊天助手：持有悬浮按钮位置与窗口开关，场景生成编排下沉 model 层的 useChatRuntime
function ChatAssistant() {
  const chatRootRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const [fabPos, setFabPos] = useState<FabPosition>(() => ({
    x: FAB_DEFAULT_LEFT,
    y: window.innerHeight - FAB_DEFAULT_BOTTOM - 40,
  }));
  const [open, setOpen] = useState(false);
  const [windowStyle, setWindowStyle] = useState<CSSProperties>({});
  const {
    runtime,
    startScene,
    cancel,
    bodyStatus,
    busyMethod,
    errorMessage,
    lastMethod,
  } = useChatRuntime();

  // 初次布局：按按钮实际高度校准默认停靠位
  useLayoutEffect(() => {
    const fab = fabRef.current;
    if (fab === null) {
      return;
    }
    setFabPos({
      x: FAB_DEFAULT_LEFT,
      y: Math.max(
        FAB_DEFAULT_BOTTOM,
        window.innerHeight - FAB_DEFAULT_BOTTOM - fab.offsetHeight,
      ),
    });
  }, []);

  // 拖拽更新按钮位置：展开中的聊天窗用新坐标同步跟随
  const handleFabPosChange = (pos: FabPosition): void => {
    setFabPos(pos);
    const fab = fabRef.current;
    if (!open || fab === null) {
      return;
    }
    // 拖拽回调里 DOM 尚未提交新位置：用目标坐标与按钮实测尺寸合成定位矩形
    const rect = new DOMRect(pos.x, pos.y, fab.offsetWidth, fab.offsetHeight);
    setWindowStyle(computeWindowStyle(rect));
  };

  // 关窗时取消在途生成，避免后台空跑
  useEffect(() => {
    if (!open && bodyStatus === 'streaming') {
      cancel();
    }
  }, [open, bodyStatus, cancel]);

  const handleToggle = (): void => {
    const fab = fabRef.current;
    if (open) {
      setOpen(false);
      return;
    }
    if (fab !== null) {
      setWindowStyle(computeWindowStyle(fab.getBoundingClientRect()));
    }
    setOpen(true);
  };

  return (
    <div ref={chatRootRef} className="hijob-chat-root">
      <ChatFab
        fabRef={fabRef}
        pos={fabPos}
        onPosChange={handleFabPosChange}
        onToggle={handleToggle}
      />
      {/* // > 聊天窗条件渲染：关闭即卸载，流式状态保留在本组件的 runtime Hook 里 */}
      {open && (
        <AssistantRuntimeProvider runtime={runtime}>
          <ChatWindow
            style={windowStyle}
            bodyStatus={bodyStatus}
            errorMessage={errorMessage}
            busyMethod={busyMethod}
            lastMethod={lastMethod}
            onScene={startScene}
            onClose={() => setOpen(false)}
            tooltipContainerRef={chatRootRef}
          />
        </AssistantRuntimeProvider>
      )}
    </div>
  );
}

// 聊天 UI 根：SPA 进入聊天页前不渲染任何内容
function ChatApp(): ReactElement | null {
  const [ready, setReady] = useState(isChatPageReady);

  // 监听会话容器出现：SPA 路由切进聊天页时挂载助手
  useEffect(() => {
    if (ready) {
      return;
    }
    const observer = new MutationObserver(() => {
      if (isChatPageReady()) {
        setReady(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ready]);

  if (!ready) {
    return null;
  }
  return <ChatAssistant />;
}

export { ChatApp };
