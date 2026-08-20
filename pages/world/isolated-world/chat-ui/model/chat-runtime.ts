// # 聊天 runtime 组装：把流式状态机接入 assistant-ui external store，纯 model 层供视图消费

import {
  type AssistantRuntime,
  type MessageStatus,
  type ReasoningMessagePart,
  type TextMessagePart,
  type ThreadMessageLike,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { requestChatContext } from './chat-context';
import { pickScenePhrase } from './scene-phrases';
import {
  type AiStreamMethod,
  type AiTimingStats,
  type StreamStatus,
  useAiStream,
} from './use-ai-stream';

// assistant 正文片段类型：思考与文本两类 part
type AssistantPart = ReasoningMessagePart | TextMessagePart;

// Hook 返回结构
interface UseChatRuntimeResult {
  runtime: AssistantRuntime; // assistant-ui runtime，供 AssistantRuntimeProvider 挂载
  startScene: (method: AiStreamMethod) => void; // 发起场景生成：记录场景方法后经 runtime 通道追加用户消息触发
  cancel: () => void; // 取消进行中的生成并回到空闲态（关窗时调用）
  bodyStatus: StreamStatus; // 正文状态：场景准备失败折算为 error，其余跟随流式状态
  sceneError: string; // 场景准备失败原因（会话缺失/无聊天记录/末条校验）
  busyMethod: AiStreamMethod | null; // 生成中的场景方法，对应按钮转圈
  timing: AiTimingStats | null; // 耗时用量统计：发起即建立实时跳动、done 定格，供顶栏展示
  errorMessage: string; // 视图展示的失败原因：场景准备失败优先，其次流式失败
  lastMethod: AiStreamMethod | null; // 最近一次实际发起的场景方法，终态保留，供重新生成重跑
  text: string; // 生成终态全文：自动问候完成后投递到页面输入框用
}

// 流式状态到 assistant 消息状态映射参数
interface ReadAssistantStatusOptions {
  status: StreamStatus; // 流式状态
  errorMessage: string; // 失败原因（error 态携带到消息上）
}

// 流式状态到 assistant 消息状态映射：error 携带失败原因
const readAssistantStatus = ({
  status,
  errorMessage,
}: ReadAssistantStatusOptions): MessageStatus => {
  if (status === 'streaming') {
    return { type: 'running' };
  }
  if (status === 'error') {
    return { type: 'incomplete', reason: 'error', error: errorMessage };
  }
  return { type: 'complete', reason: 'stop' };
};

// 组装聊天 runtime：持有场景状态与流式状态机，external store 消息快照驱动消息流
const useChatRuntime = (): UseChatRuntimeResult => {
  const [busyMethod, setBusyMethod] = useState<AiStreamMethod | null>(null);
  // 当前轮的用户侧俏皮话：发起场景时随机挑一条，终态保留、下次发起覆盖
  const [scenePhrase, setScenePhrase] = useState('');
  // 场景准备失败（无会话/无聊天记录）：与流式失败共用正文错误位
  const [sceneError, setSceneError] = useState('');
  // 最近一次实际发起的场景方法：终态保留（busyMethod 终态会被清除），供重新生成
  const [lastMethod, setLastMethod] = useState<AiStreamMethod | null>(null);
  const { status, text, reasoning, error, timing, start, cancel } =
    useAiStream();
  // 经 runtime 通道传递的待执行场景方法：startScene 记录、onNew 消费
  const pendingMethodRef = useRef<AiStreamMethod | null>(null);

  // 生成结束（任意终态）后清按钮转圈标记
  useEffect(() => {
    if (status !== 'streaming') {
      setBusyMethod(null);
    }
  }, [status]);

  // 发起场景生成：读会话上下文，问候不带聊天记录，其余场景带最近记录
  const handleScene = useCallback(
    (method: AiStreamMethod): void => {
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
          // 提醒（跟进）要求末条是求职者自己发的：末条是对方时引导改用「回复」
          if (
            method === 'followUp' &&
            context.messages.at(-1)?.role !== 'self'
          ) {
            setSceneError(
              '「提醒」用于你发出最后一条消息后对方未回复的场景；对方刚回复，请改用「回复」',
            );
            return;
          }
          setBusyMethod(method);
          setScenePhrase(pickScenePhrase(method));
          setLastMethod(method);
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
    },
    [start],
  );

  // external store 消息快照：空态给空数组，否则 [用户场景句, assistant 消息]
  const messages = useMemo<readonly ThreadMessageLike[]>(() => {
    // 无场景（未发起过或取消后回到空闲）时不渲染消息流
    const hasScene =
      scenePhrase !== '' &&
      (status !== 'idle' || text !== '' || reasoning !== '');
    if (!hasScene) {
      return [];
    }
    const content: AssistantPart[] = [];
    if (reasoning !== '') {
      content.push({ type: 'reasoning', text: reasoning });
    }
    if (text !== '') {
      content.push({ type: 'text', text });
    }
    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            // 俏皮话读作用户对助手说的话：流式期间带省略号表示「正在办」
            text: status === 'streaming' ? `${scenePhrase}…` : scenePhrase,
          },
        ],
      },
      {
        role: 'assistant',
        content,
        status: readAssistantStatus({ status, errorMessage: error }),
      },
    ];
  }, [scenePhrase, status, text, reasoning, error]);

  // 外部消息到 ThreadMessageLike 的恒等转换：消息已在快照内组装完成
  const convertMessage = useCallback(
    (message: ThreadMessageLike): ThreadMessageLike => message,
    [],
  );

  // 消费 startScene 记录的场景方法并执行生成：无待执行方法时忽略
  const onNew = useCallback(async (): Promise<void> => {
    const method = pendingMethodRef.current;
    pendingMethodRef.current = null;
    if (method === null) {
      return;
    }
    handleScene(method);
  }, [handleScene]);

  // 取消进行中的生成：external store 的 onCancel 需返回 Promise
  const onCancel = useCallback(async (): Promise<void> => {
    cancel();
  }, [cancel]);

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages,
    isRunning: status === 'streaming',
    onNew,
    onCancel,
    convertMessage,
  });

  // 发起场景：记录方法后经 runtime 通道追加触发消息（内容仅作 onNew 触发，实际展示走 scenePhrase）
  const startScene = useCallback(
    (method: AiStreamMethod): void => {
      pendingMethodRef.current = method;
      runtime.thread.append(method);
    },
    [runtime],
  );

  // 正文状态：场景准备失败折算为 error，其余跟随流式状态
  const bodyStatus = sceneError !== '' ? 'error' : status;

  return {
    runtime,
    startScene,
    cancel,
    bodyStatus,
    sceneError,
    busyMethod,
    timing,
    errorMessage: sceneError !== '' ? sceneError : error,
    lastMethod,
    text,
  };
};

export type { UseChatRuntimeResult };
export { useChatRuntime };
