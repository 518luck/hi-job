// # AI 流式编排（后台）：requestId 注册表、思考与正文增量攒批发送与主动取消
//
// 启动消息立即返回 requestId，生成在后台异步执行；reasoning/chunk/end/error 事件经
// tabs.sendMessage 的 hiJobStream 信封推送到发起生成的标签页，聊天 UI 按 requestId 关联消费。

import type { AiStreamEvent } from '@/shared/zod';

// 进行中的流：中止控制器与推送目标标签页
interface ActiveStream {
  controller: AbortController; // 中止在途生成
  tabId?: number; // 发起生成的标签页 id，事件推送目标
}

// 流式用量：模型上报的 token 计数
interface AiStreamUsage {
  inputTokens: number; // 输入 token 数
  outputTokens: number; // 输出 token 数
}

// 流式任务入参：增量回调与中止信号由编排层注入
interface StreamCallbacks {
  onChunk: (delta: string) => void; // 逐块正文增量
  onReasoning?: (delta: string) => void; // 逐块思考增量：模型未产出思考时不会触发
  onUsage?: (usage: AiStreamUsage) => void; // 生成结束上报 token 用量：供应商未上报时缺失
  abortSignal: AbortSignal; // 取消信号
}

// 流式生成任务：resolve 完整文本，reject 携带可展示错误
type StreamTask = (callbacks: StreamCallbacks) => Promise<string>;

// 启动选项
interface StartAiStreamOptions {
  tabId?: number; // 发起生成的标签页 id
  task: StreamTask; // 生成任务
}

// 增量攒批窗口：相邻增量合并一次推送，避免长回复打爆消息通道
const CHUNK_FLUSH_MS = 80;

// 增量缓冲器入参
interface DeltaBufferOptions {
  requestId: string; // 流式请求 id
  tabId?: number; // 事件推送目标标签页
  kind: 'chunk' | 'reasoning'; // 推送的事件类型：正文增量或思考增量
}

// 增量缓冲器：同类增量在攒批窗口内合并，到期一次推送；提供残余冲刷与丢弃
const createDeltaBuffer = ({ requestId, tabId, kind }: DeltaBufferOptions) => {
  let buffer = '';
  let flushTimer: ReturnType<typeof setTimeout> | undefined;

  // 追加增量：窗口内只安排一次到期推送
  const push = (delta: string): void => {
    buffer += delta;
    if (flushTimer !== undefined) {
      return;
    }
    flushTimer = setTimeout(() => {
      flushTimer = undefined;
      const pending = buffer;
      buffer = '';
      void pushStreamEvent(tabId, { requestId, kind, delta: pending });
    }, CHUNK_FLUSH_MS);
  };

  // 冲刷残余增量并清定时器：结束前调用，保证残余先于 end 送达
  const flush = async (): Promise<void> => {
    if (flushTimer !== undefined) {
      clearTimeout(flushTimer);
      flushTimer = undefined;
    }
    if (buffer === '') {
      return;
    }
    const pending = buffer;
    buffer = '';
    await pushStreamEvent(tabId, { requestId, kind, delta: pending });
  };

  // 丢弃残余增量并清定时器：异常路径调用，残余不再推送
  const dispose = (): void => {
    if (flushTimer !== undefined) {
      clearTimeout(flushTimer);
      flushTimer = undefined;
    }
    buffer = '';
  };

  return { push, flush, dispose };
};

// 进行中的流注册表：requestId → 流上下文
const activeStreams = new Map<string, ActiveStream>();

// 推送流事件到发起页：页面已关闭或未就绪时静默忽略
const pushStreamEvent = async (
  tabId: number | undefined,
  event: AiStreamEvent,
): Promise<void> => {
  if (tabId === undefined) {
    return;
  }
  await browser.tabs.sendMessage(tabId, { hiJobStream: event }).catch(() => {});
};

// 启动一次流式生成：立即返回 requestId，任务异步执行、结束自动清理注册
const startAiStream = ({
  tabId,
  task,
}: StartAiStreamOptions): { requestId: string } => {
  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  activeStreams.set(requestId, { controller, tabId });
  void executeStream({ requestId, tabId, controller, task });
  return { requestId };
};

// 执行选项
interface ExecuteStreamOptions {
  requestId: string; // 流式请求 id
  tabId?: number; // 事件推送目标
  controller: AbortController; // 中止控制器
  task: StreamTask; // 生成任务
}

// 执行流式任务：思考与正文增量分开攒批推送，成功先冲刷两缓冲残余再推 end、失败推 error，始终清理注册
const executeStream = async ({
  requestId,
  tabId,
  controller,
  task,
}: ExecuteStreamOptions): Promise<void> => {
  // 思考与正文各用独立缓冲：两类增量互不阻塞、各自按窗口合并推送
  const reasoningBuffer = createDeltaBuffer({
    requestId,
    tabId,
    kind: 'reasoning',
  });
  const textBuffer = createDeltaBuffer({ requestId, tabId, kind: 'chunk' });
  // 模型上报的用量：经 onUsage 回调捕获，随 end 事件推送到发起页
  let usage: AiStreamUsage | undefined;
  try {
    const text = await task({
      abortSignal: controller.signal,
      onChunk: (delta) => {
        textBuffer.push(delta);
      },
      onReasoning: (delta) => {
        reasoningBuffer.push(delta);
      },
      onUsage: (reported) => {
        usage = reported;
      },
    });
    await reasoningBuffer.flush();
    await textBuffer.flush();
    await pushStreamEvent(tabId, { requestId, kind: 'end', text, usage });
  } catch (error) {
    reasoningBuffer.dispose();
    textBuffer.dispose();
    await pushStreamEvent(tabId, {
      requestId,
      kind: 'error',
      message: error instanceof Error ? error.message : '生成失败',
    });
  } finally {
    activeStreams.delete(requestId);
  }
};

// 取消一次流式生成：发起页关闭窗口或重新发起时调用；未知 id 静默忽略
const cancelAiStream = (requestId: string): void => {
  activeStreams.get(requestId)?.controller.abort();
};

export type { AiStreamUsage, StreamCallbacks };
export { cancelAiStream, startAiStream };
