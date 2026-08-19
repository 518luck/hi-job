// # 聊天助手应用（聊天 UI 根）：等聊天容器出现后渲染悬浮按钮与聊天窗，编排流式生成

import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { requestChatContext } from '../model/chat-context';
import { type AiStreamMethod, useAiStream } from '../model/use-ai-stream';
import { ChatFab, type FabPosition } from './chat-fab';
import {
  CHAT_WINDOW_HEIGHT,
  CHAT_WINDOW_WIDTH,
  ChatWindow,
} from './chat-window';

// 悬浮按钮默认停靠：视口左下角
const FAB_DEFAULT_LEFT = 16;
const FAB_DEFAULT_BOTTOM = 56;

// 聊天窗与按钮的间距
const WINDOW_GAP = 12;

// 视口边距：窗口水平定位的钳制边界
const VIEWPORT_MARGIN = 8;

// 场景方法到中文名的映射：消息流用户侧消息措辞使用
const SCENE_LABELS: Record<AiStreamMethod, string> = {
  greeting: '问候',
  followUp: '提醒',
  rejectionFeedback: '反馈',
  generateReply: '回复',
};

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

// 聊天助手：持有悬浮按钮位置、窗口开关与流式状态，发起各场景生成
function ChatAssistant() {
  const chatRootRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const [fabPos, setFabPos] = useState<FabPosition>(() => ({
    x: FAB_DEFAULT_LEFT,
    y: window.innerHeight - FAB_DEFAULT_BOTTOM - 40,
  }));
  const [open, setOpen] = useState(false);
  const [windowStyle, setWindowStyle] = useState<CSSProperties>({});
  const [busyMethod, setBusyMethod] = useState<AiStreamMethod | null>(null);
  // 当前场景中文名：消息流用户侧消息展示，终态保留、下次发起场景时覆盖
  const [sceneLabel, setSceneLabel] = useState('');
  // 场景准备失败（无会话/无聊天记录）：与流式失败共用正文错误位
  const [sceneError, setSceneError] = useState('');
  const { status, reasoning, text, error, start, cancel } = useAiStream();

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
    if (!open && status === 'streaming') {
      cancel();
      setBusyMethod(null);
    }
  }, [open, status, cancel]);

  // 生成结束（任意终态）后清按钮转圈标记
  useEffect(() => {
    if (status !== 'streaming') {
      setBusyMethod(null);
    }
  }, [status]);

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

  // 发起场景生成：读会话上下文，问候不带聊天记录，其余场景带最近记录
  const handleScene = (method: AiStreamMethod): void => {
    setSceneError('');
    void requestChatContext()
      .then(async (context) => {
        if (context === null) {
          setSceneError('未找到当前会话信息（页面可能还在加载）');
          return;
        }
        // 消息场景依赖聊天记录，问候除外
        if (context.messages.length === 0 && method !== 'greeting') {
          setSceneError('暂无聊天记录（页面可能还在加载）');
          return;
        }
        // 提醒（跟进）要求末条是求职者自己发的：末条是对方时引导改用「回复」，避免走到后台报「参数不合法」
        if (method === 'followUp' && context.messages.at(-1)?.role !== 'self') {
          setSceneError(
            '「提醒」用于你发出最后一条消息后对方未回复的场景；对方刚回复，请改用「回复」',
          );
          return;
        }
        setBusyMethod(method);
        setSceneLabel(SCENE_LABELS[method]);
        const { jobId, jd, hr, messages } = context;
        if (method === 'greeting') {
          await start('greeting', { jobId, jd, hr });
          return;
        }
        await start(method, { jobId, jd, hr, messages });
      })
      .catch(() => {
        setSceneError('读取会话信息失败，请重试');
      });
  };

  // 正文状态：场景准备失败折算为 error，其余跟随流式状态
  const bodyStatus = sceneError !== '' ? 'error' : status;

  return (
    <div ref={chatRootRef} className="hijob-chat-root">
      <ChatFab
        fabRef={fabRef}
        pos={fabPos}
        onPosChange={handleFabPosChange}
        onToggle={handleToggle}
      />
      {/* // > 聊天窗条件渲染：关闭即卸载，文本状态保留在本组件的流式 Hook 里 */}
      {open && (
        <ChatWindow
          style={windowStyle}
          bodyStatus={bodyStatus}
          text={text}
          reasoning={reasoning}
          sceneLabel={sceneLabel}
          errorMessage={sceneError !== '' ? sceneError : error}
          busyMethod={busyMethod}
          onScene={handleScene}
          onClose={() => setOpen(false)}
          tooltipContainerRef={chatRootRef}
        />
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
