// # AI 回复聊天窗（聊天 UI）：标题栏 + 正文消息流 + 场景操作区，正文经 useAuiState 读 runtime 线程消息

import { type AssistantState, useAuiState } from '@assistant-ui/react';
import { Check, Copy, Loader2, X } from 'lucide-react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

import { useElapsedSeconds, useWordSegments } from '../model/stream-driver';
import { pickThinkingPhrase } from '../model/thinking-phrases';
import type { AiStreamMethod, StreamStatus } from '../model/use-ai-stream';
import { MessagePair } from './elements/message-pair';
import { ReasoningPanel } from './elements/reasoning-panel';
import { TypingIndicator } from './elements/typing-indicator';

// 聊天窗尺寸：与父级定位计算保持一致
const CHAT_WINDOW_WIDTH = 340;
const CHAT_WINDOW_HEIGHT = 420;

// 悬停气泡展示延迟：避免扫过按钮时频繁闪现
const HOVER_DELAY_MS = 300;

// 复制成功对勾的恢复时长
const COPY_RESET_MS = 1200;

// 悬停气泡层级：窗口自身为 z-2147483646，气泡挂 shadow 根需更高层才能压住窗口
const TOOLTIP_Z_CLASS = 'z-[2147483647]';

// 消息流条目类型：经 AssistantState 的 thread scope 推导（含 parts 的消息状态，非 legacy MessageState）
type ChatThreadMessage = AssistantState['thread']['messages'][number];

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
  errorMessage: string; // 失败原因（error 态时有值）
  busyMethod: AiStreamMethod | null; // 生成中的场景，对应按钮转圈
  lastMethod: AiStreamMethod | null; // 最近一次实际发起的场景，供重新生成重跑
  onScene: (method: AiStreamMethod) => void; // 发起场景生成
  onClose: () => void; // 关闭聊天窗
  tooltipContainerRef: RefObject<HTMLDivElement | null>; // 悬停气泡挂载容器（shadow 根元素）
}

// AI 回复聊天窗：正文区按状态渲染（错误/占位/消息流），操作区发起各场景生成
// ! 必须渲染在 AssistantRuntimeProvider 内：正文经 useAuiState 读 runtime 线程消息
function ChatWindow({
  style,
  bodyStatus,
  errorMessage,
  busyMethod,
  lastMethod,
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
  // 思考面板展开态：默认收起
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // runtime 线程状态：消息流驱动正文渲染，运行标记驱动加载与流式态
  const messages = useAuiState((s) => s.thread.messages);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const userText = readUserText(messages);
  const { reasoning, text } = readAssistantContent(messages);
  const segments = useWordSegments(text);
  // 思考计时：仅思考阶段计时，思考结束后停表保持读数用于「思考了 N 秒」收尾；短语随当前时间定时随机切换
  const { elapsedSeconds: thinkingSeconds } = useElapsedSeconds({
    active: isRunning && text === '',
  });
  const streamingLabel = pickThinkingPhrase(Date.now());

  // 思考步骤：思考文本非空行 map 成步骤标题（无正文）
  const reasoningSteps = useMemo(
    () => splitNonEmptyLines(reasoning).map((title) => ({ title })),
    [reasoning],
  );

  // 流式生成中自动滚底：思考或正文增长时消息流始终贴在最新处
  useEffect(() => {
    const body = bodyRef.current;
    if (body === null || !isRunning) {
      return;
    }
    // 尚无流式内容时不滚动：加载指示期间内容仍贴顶，无需滚动
    if (reasoning === '' && text === '') {
      return;
    }
    body.scrollTop = body.scrollHeight;
  }, [text, reasoning, isRunning]);

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

  // 重新生成：重跑最近一次场景，生成中不响应（与场景按钮禁用一致）
  const handleRegenerate = (): void => {
    if (isRunning || lastMethod === null) {
      return;
    }
    onScene(lastMethod);
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

  // 正文渲染：错误含授权入口、空流占位，其余按消息流渲染（消息对/思考面板/加载指示）
  const renderBody = (): ReactNode => {
    if (bodyStatus === 'error') {
      return (
        <div className="whitespace-pre-wrap break-all">
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
    if (messages.length === 0) {
      return '点击下方「生成回复」，获取下一条回复建议';
    }
    // 消息对整体：场景发起即挂载（用户气泡立刻在场），思考与等待指示插在气泡与正文之间，
    // 保持「请求 → 思考 → 正文」的阅读顺序；两者互斥且无内容时不传插槽，避免占位空隙拉开正文间距
    const isWaitingFirstToken = isRunning && reasoning === '' && text === '';
    return (
      <MessagePair
        userMessage={userText}
        words={segments.map((segment) => segment.text)}
        visibleWords={segments.length}
        streaming={isRunning}
        onCopy={() => void handleCopy()}
        onRegenerate={handleRegenerate}
      >
        {(isWaitingFirstToken || reasoning !== '') &&
          (isWaitingFirstToken ? (
            // 等待首个 token：裸三点输入指示靠左小占位，避免静止无反馈
            <TypingIndicator variant="bare" className="py-2" />
          ) : (
            <ReasoningPanel
              steps={reasoningSteps}
              visibleSteps={reasoningSteps.length}
              streaming={isRunning && text === ''}
              open={reasoningOpen}
              onOpenChange={setReasoningOpen}
              restingLabel={`思考了 ${Math.max(thinkingSeconds, 1)} 秒`}
              streamingLabel={streamingLabel}
              elapsed={
                isRunning && text === '' ? `${thinkingSeconds}s` : undefined
              }
            />
          ))}
      </MessagePair>
    );
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
          {/* // @ 正文区：消息流（消息对/思考面板/加载指示），错误与占位单独分支 */}
          <CardContent
            ref={bodyRef}
            className="hijob-chat-scroll flex-1 overflow-y-auto border-t border-border px-3.5 py-3 text-[13px] leading-[1.8]"
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
              aria-label="复制"
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

// 读取用户侧场景句：消息流首条消息的文本 part
const readUserText = (messages: readonly ChatThreadMessage[]): string => {
  for (const part of messages[0]?.parts ?? []) {
    if (part.type === 'text') {
      return part.text;
    }
  }
  return '';
};

// 读取 assistant 思考与正文：消息流第二条消息按 part 类型取对应文本
const readAssistantContent = (
  messages: readonly ChatThreadMessage[],
): { reasoning: string; text: string } => {
  let reasoning = '';
  let text = '';
  for (const part of messages[1]?.parts ?? []) {
    if (part.type === 'reasoning') {
      reasoning = part.text;
    } else if (part.type === 'text') {
      text = part.text;
    }
  }
  return { reasoning, text };
};

// 拆分思考文本为非空行：逐行 trim 后过滤空白行，作为思考步骤标题
const splitNonEmptyLines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

export { CHAT_WINDOW_HEIGHT, CHAT_WINDOW_WIDTH, ChatWindow };
