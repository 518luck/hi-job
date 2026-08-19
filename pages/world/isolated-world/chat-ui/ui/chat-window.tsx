// # AI 回复聊天窗（聊天 UI）：标题栏 + 正文 + 场景操作区，正文实时渲染流式生成

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSmoothStream } from 'smooth-stream-text/react';

import { AUTH_ERROR_MARKER } from '@/shared/infra/ai';
import { sendMessage } from '@/shared/infra/messaging';

import type { AiStreamMethod, StreamStatus } from '../model/use-ai-stream';

// 聊天窗尺寸：与父级定位计算保持一致
const CHAT_WINDOW_WIDTH = 340;
const CHAT_WINDOW_HEIGHT = 420;

// 悬停气泡展示延迟：避免扫过按钮时频繁闪现
const HOVER_DELAY_MS = 300;

// 复制成功对勾的恢复时长
const COPY_RESET_MS = 1200;

// 是否启用动画：跟随系统「减弱动态」设置，聊天 UI 不渲染不动画内容
const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

// 场景按钮元数据：文案、协议方法与使用时机说明
const SCENE_BUTTONS: {
  label: string;
  method: AiStreamMethod;
  tip: string;
}[] = [
  {
    label: '问候',
    method: 'greeting',
    tip: '首次联系时结合职位与 HR 信息生成打招呼语',
  },
  {
    label: '提醒',
    method: 'followUp',
    tip: '对方已读未回时生成自然跟进；招聘者刚回复请用「回复」',
  },
  {
    label: '反馈',
    method: 'rejectionFeedback',
    tip: '沟通结束或被拒后，生成礼貌请教反馈的消息',
  },
  {
    label: '回复',
    method: 'generateReply',
    tip: '结合聊天记录与职位信息，生成下一条回复',
  },
];

// 描边按钮样式：操作区非主按钮共用（复制与问候/提醒/反馈）
const OUTLINED_BUTTON_CLASS =
  'relative flex-1 rounded-md border border-[#3f3f46] bg-transparent px-3 py-[6px] text-[12px] text-[#fafafa] transition-colors hover:border-[#a1a1aa] hover:bg-[#18181b] disabled:cursor-not-allowed disabled:opacity-60';

// 主按钮样式：回复按钮实底强调
const PRIMARY_BUTTON_CLASS =
  'relative flex-1 rounded-md border border-transparent bg-[#fafafa] px-3 py-[6px] text-[12px] text-[#18181b] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60';

// 聊天窗属性
interface ChatWindowProps {
  style: CSSProperties; // 定位样式，父级按悬浮按钮位置计算
  bodyStatus: StreamStatus; // 正文状态（含场景准备失败折算的 error）
  text: string; // 已生成文本，流式累加
  errorMessage: string; // 失败原因（error 态时有值）
  busyMethod: AiStreamMethod | null; // 生成中的场景，对应按钮转圈
  onScene: (method: AiStreamMethod) => void; // 发起场景生成
  onClose: () => void; // 关闭聊天窗
}

// 悬停提示按钮属性
interface TipButtonProps {
  title: string; // 气泡标题（按钮名）
  tip: string; // 使用时机说明
  label: ReactNode; // 按钮内容
  busy: boolean; // 生成中转圈
  disabled: boolean; // 禁用态
  primary: boolean; // 主按钮样式（回复）
  onClick: () => void; // 点击回调
}

// 带悬停气泡的场景按钮：延迟展示使用时机，水平居中于按钮并夹在窗宽内
function TipButton({
  title,
  tip,
  label,
  busy,
  disabled,
  primary,
  onClick,
}: TipButtonProps) {
  const hostRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [left, setLeft] = useState(0);

  // 展示后定位：按按钮中心对齐并夹在窗内，越靠右的按钮不把气泡挤窄
  useEffect(() => {
    if (!visible) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const host = hostRef.current;
      const tipElement = tipRef.current;
      if (host === null || tipElement === null) {
        return;
      }
      const containerWidth =
        host.closest('[data-hijob-chat-window]')?.clientWidth ??
        CHAT_WINDOW_WIDTH;
      const center = host.offsetLeft + host.offsetWidth / 2;
      const half = tipElement.offsetWidth / 2;
      setLeft(Math.min(Math.max(center, half + 8), containerWidth - half - 8));
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const show = (): void => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, HOVER_DELAY_MS);
  };

  const hide = (): void => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <button
      ref={hostRef}
      type="button"
      disabled={disabled}
      className={primary ? PRIMARY_BUTTON_CLASS : OUTLINED_BUTTON_CLASS}
      onPointerEnter={(event) => {
        // 仅鼠标悬停触发：触屏点按不弹气泡
        if (event.pointerType === 'mouse') {
          show();
        }
      }}
      onPointerLeave={hide}
      onClick={() => {
        hide();
        onClick();
      }}
    >
      {busy ? <span className="hijob-button-spinner" /> : label}
      {/* // > 气泡随按钮显隐，绝对定位于按钮上方，不拦截鼠标事件 */}
      {visible && (
        <div
          ref={tipRef}
          style={{ left }}
          className="pointer-events-none absolute bottom-full mb-1.5 max-w-75 -translate-x-1/2 border border-[#3f3f46] bg-[#fafafa] px-2.5 py-2 text-[12px] leading-[1.6] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
        >
          <span className="font-semibold">{title} · </span>
          {tip}
        </div>
      )}
    </button>
  );
}

// AI 回复聊天窗：正文区按状态渲染（占位/转圈/流式文本/错误），操作区发起各场景生成
function ChatWindow({
  style,
  bodyStatus,
  text,
  errorMessage,
  busyMethod,
  onScene,
  onClose,
}: ChatWindowProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done'>(
    'idle',
  );
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [authPending, setAuthPending] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // 流式生成中经库层匀速打字机显示，终态/减弱动态时直接显示全文
  const reduceMotion = usePrefersReducedMotion();
  const { text: shownText } = useSmoothStream(text, {
    done: bodyStatus !== 'streaming' || reduceMotion,
  });

  // 流式生成中自动滚底：新文本出现时正文始终贴在最新处
  useEffect(() => {
    const body = bodyRef.current;
    if (body === null || bodyStatus !== 'streaming') {
      return;
    }
    if (shownText === '') {
      return;
    }
    body.scrollTop = body.scrollHeight;
  }, [shownText, bodyStatus]);

  // 复制恢复定时器清理
  useEffect(() => () => clearTimeout(copyResetTimer.current), []);

  // 复制正文：生成文本优先，错误态复制错误文案
  const handleCopy = async (): Promise<void> => {
    clearTimeout(copyResetTimer.current);
    setCopyState('copying');
    let copied = false;
    try {
      await navigator.clipboard.writeText(text !== '' ? text : errorMessage);
      copied = true;
    } catch {
      // 剪贴板不可用时静默失败，不打断聊天窗
    }
    setCopyState(copied ? 'done' : 'idle');
    if (copied) {
      copyResetTimer.current = setTimeout(() => {
        setCopyState('idle');
      }, COPY_RESET_MS);
    }
  };

  // 一键打开授权小窗：期间禁用防重复开窗，失败时提示可重试
  const handleAuth = (): void => {
    setAuthPending(true);
    void sendMessage('openAiVendorAuth', undefined)
      .then(() => {
        setAuthFailed(false);
      })
      .catch(() => {
        setAuthFailed(true);
      })
      .finally(() => {
        setAuthPending(false);
      });
  };

  // 正文渲染：空流先转圈、错误含授权入口、有文本即渲染（流式用打字机文本）
  const renderBody = (): ReactNode => {
    if (bodyStatus === 'streaming' && shownText === '') {
      return <span className="hijob-loading-spinner" />;
    }
    if (bodyStatus === 'error') {
      return (
        <div>
          {errorMessage}
          {errorMessage.includes(AUTH_ERROR_MARKER) && (
            <button
              type="button"
              disabled={authPending}
              onClick={handleAuth}
              className="mt-2.5 block rounded-md border border-transparent bg-[#fafafa] px-4 py-1.5 text-[12px] whitespace-nowrap text-[#18181b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authFailed ? '打开失败，点击重试' : '去授权'}
            </button>
          )}
        </div>
      );
    }
    if (shownText !== '') {
      return shownText;
    }
    return '点击下方「生成回复」，获取下一条回复建议';
  };

  // 复制按钮内容：复制中转圈、成功打对勾（单窄字符不撑宽）
  const renderCopyContent = (): ReactNode => {
    if (copyState === 'copying') {
      return <span className="hijob-button-spinner" />;
    }
    if (copyState === 'done') {
      return '✓';
    }
    return '复制';
  };

  return (
    <div
      data-hijob-chat-window="1"
      style={{
        width: CHAT_WINDOW_WIDTH,
        height: CHAT_WINDOW_HEIGHT,
        ...style,
      }}
      className="fixed z-2147483646 flex flex-col overflow-hidden border border-[#3f3f46] bg-[#18181b] text-[#fafafa] shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]"
    >
      {/* // @ 标题栏 */}
      <div className="flex items-center justify-between border-b border-[#3f3f46] bg-[#27272a] px-3.5 py-2.5 text-[13px] font-semibold">
        <span>AI 回复</span>
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent px-2 py-0.5 text-[16px] leading-none text-[#a1a1aa] transition-colors hover:bg-[#3f3f46] hover:text-[#dc2626]"
        >
          ×
        </button>
      </div>
      {/* // @ 正文区：错误/空流转圈时内容居中 */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-3.5 py-3 text-[13px] leading-[1.8] break-all whitespace-pre-wrap has-[.hijob-loading-spinner]:flex has-[.hijob-loading-spinner]:items-center has-[.hijob-loading-spinner]:justify-center"
      >
        {renderBody()}
      </div>
      {/* // @ 操作区：场景按钮 + 复制 */}
      <div className="flex gap-2 border-t border-[#3f3f46] bg-[#27272a] px-3.5 py-2.5">
        {SCENE_BUTTONS.map(({ label, method, tip }) => (
          <TipButton
            key={method}
            title={label}
            tip={tip}
            label={label}
            busy={busyMethod === method && bodyStatus === 'streaming'}
            disabled={bodyStatus === 'streaming'}
            primary={method === 'generateReply'}
            onClick={() => onScene(method)}
          />
        ))}
        <button
          type="button"
          disabled={copyState === 'copying'}
          onClick={() => void handleCopy()}
          className={OUTLINED_BUTTON_CLASS}
        >
          {renderCopyContent()}
        </button>
      </div>
    </div>
  );
}

export { CHAT_WINDOW_HEIGHT, CHAT_WINDOW_WIDTH, ChatWindow };
