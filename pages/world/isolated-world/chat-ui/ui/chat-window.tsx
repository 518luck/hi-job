// # AI 回复聊天窗（聊天 UI）：标题栏 + 正文 + 场景操作区，正文实时渲染流式生成

import { Check, Copy, Loader2, X } from 'lucide-react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSmoothStream } from 'smooth-stream-text/react';

import { AUTH_ERROR_MARKER } from '@/shared/infra/ai';
import { sendMessage } from '@/shared/infra/messaging';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

import type { AiStreamMethod, StreamStatus } from '../model/use-ai-stream';

// 聊天窗尺寸：与父级定位计算保持一致
const CHAT_WINDOW_WIDTH = 340;
const CHAT_WINDOW_HEIGHT = 420;

// 悬停气泡展示延迟：避免扫过按钮时频繁闪现
const HOVER_DELAY_MS = 300;

// 复制成功对勾的恢复时长
const COPY_RESET_MS = 1200;

// 悬停气泡层级：窗口自身为 z-2147483646，气泡挂 shadow 根需更高层才能压住窗口
const TOOLTIP_Z_CLASS = 'z-[2147483647]';

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

// 场景按钮元数据：文案、协议方法与使用时机说明（tip 用作悬停气泡内容；
// align 控制气泡对齐：按按钮在窗内位置钳制 240px 气泡不溢出窗宽/视口）
const SCENE_BUTTONS: {
  label: string;
  method: AiStreamMethod;
  tip: string;
  align: 'start' | 'center' | 'end';
}[] = [
  {
    label: '问候',
    method: 'greeting',
    tip: '首次联系时结合职位与 HR 信息生成打招呼语',
    align: 'start',
  },
  {
    label: '提醒',
    method: 'followUp',
    tip: '对方已读未回时生成自然跟进；招聘者刚回复请用「回复」',
    align: 'start',
  },
  {
    label: '反馈',
    method: 'rejectionFeedback',
    tip: '沟通结束或被拒后，生成礼貌请教反馈的消息',
    align: 'center',
  },
  {
    label: '回复',
    method: 'generateReply',
    tip: '结合聊天记录与职位信息，生成下一条回复',
    align: 'end',
  },
];

// 聊天窗属性
interface ChatWindowProps {
  style: CSSProperties; // 定位样式，父级按悬浮按钮位置计算
  bodyStatus: StreamStatus; // 正文状态（含场景准备失败折算的 error）
  text: string; // 已生成文本，流式累加
  errorMessage: string; // 失败原因（error 态时有值）
  busyMethod: AiStreamMethod | null; // 生成中的场景，对应按钮转圈
  onScene: (method: AiStreamMethod) => void; // 发起场景生成
  onClose: () => void; // 关闭聊天窗
  tooltipContainerRef: RefObject<HTMLDivElement | null>; // 悬停气泡挂载容器（shadow 根元素）
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
  tooltipContainerRef,
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
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (bodyStatus === 'error') {
      return (
        <div>
          {errorMessage}
          {errorMessage.includes(AUTH_ERROR_MARKER) && (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={authPending}
              onClick={handleAuth}
              className="mt-2.5 flex"
            >
              {authFailed ? '打开失败，点击重试' : '去授权'}
            </Button>
          )}
        </div>
      );
    }
    if (shownText !== '') {
      return shownText;
    }
    return '点击下方「生成回复」，获取下一条回复建议';
  };

  // 复制按钮内容：复制中转圈、成功打对勾（图标尺寸由按钮 size 统一给）
  const renderCopyContent = (): ReactNode => {
    if (copyState === 'copying') {
      return <Loader2 className="animate-spin" />;
    }
    if (copyState === 'done') {
      return <Check />;
    }
    return <Copy />;
  };

  return (
    <TooltipProvider
      delay={HOVER_DELAY_MS}
      container={tooltipContainerRef.current ?? null}
    >
      <div
        data-hijob-chat-window="1"
        style={{
          width: CHAT_WINDOW_WIDTH,
          height: CHAT_WINDOW_HEIGHT,
          ...style,
        }}
        className="fixed z-2147483646 flex flex-col overflow-hidden border border-[#3f3f46] bg-[#18181b] text-[#fafafa] shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]"
      >
        <Card className="size-full gap-0 py-0 ring-0">
          {/* // @ 标题栏 */}
          <CardHeader className="items-center bg-[#27272a] px-3.5 py-2.5">
            <CardTitle className="text-[13px] font-semibold">AI 回复</CardTitle>
            <CardAction className="self-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="关闭"
                onClick={onClose}
                className="text-muted-foreground hover:text-destructive"
              >
                <X />
              </Button>
            </CardAction>
          </CardHeader>
          {/* // @ 正文区：错误/空流转圈时内容居中 */}
          <CardContent
            ref={bodyRef}
            className="flex-1 overflow-y-auto border-t border-border px-3.5 py-3 text-[13px] leading-[1.8] break-all whitespace-pre-wrap"
          >
            {renderBody()}
          </CardContent>
          {/* // @ 操作区：场景按钮 + 复制 */}
          <CardFooter className="gap-2 border-border bg-[#27272a] px-3.5 py-2.5">
            {SCENE_BUTTONS.map(({ label, method, tip, align }) => (
              <Tooltip key={method}>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={
                        method === 'generateReply' ? 'default' : 'outline'
                      }
                      size="sm"
                      className="flex-1"
                      disabled={bodyStatus === 'streaming'}
                      onClick={() => onScene(method)}
                    >
                      {busyMethod === method && bodyStatus === 'streaming' ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        label
                      )}
                    </Button>
                  }
                />
                <TooltipContent
                  align={align}
                  positionerClassName={TOOLTIP_Z_CLASS}
                >
                  <span className="font-semibold">{label} · </span>
                  {tip}
                </TooltipContent>
              </Tooltip>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={copyState === 'copying'}
              onClick={() => void handleCopy()}
            >
              {renderCopyContent()}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export { CHAT_WINDOW_HEIGHT, CHAT_WINDOW_WIDTH, ChatWindow };
