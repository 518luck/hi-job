// # AI 流式消费 Hook：发起生成、接收后台 hiJobStream 推送、空闲超时与主动取消

import type { GetDataType } from '@webext-core/messaging';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProtocolMap } from '@/shared/infra/messaging';
import { sendMessage } from '@/shared/infra/messaging';
import { readProperty } from '@/shared/lib/page-property';
import {
  type AiStreamEvent,
  type AiStreamHandle,
  aiStreamEventSchema,
} from '@/shared/zod';

import {
  CHUNK_GAP_TIMEOUT_MS,
  FIRST_CHUNK_TIMEOUT_MS,
} from '../config/use-ai-stream';

// 流式状态机：idle 空闲 / streaming 生成中 / done 完成 / error 失败
type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

// 返回流式句柄的协议方法：编译期从 ProtocolMap 挑出，防止传入一次性方法
type AiStreamMethod = {
  [K in keyof ProtocolMap]: ProtocolMap[K] extends (
    data: never,
  ) => AiStreamHandle
    ? K
    : never;
}[keyof ProtocolMap];

// Hook 返回结构
interface UseAiStreamResult {
  status: StreamStatus; // 当前流式状态
  text: string; // 已生成的文本（流式累加，end 事件替换为全文）
  reasoning: string; // 已累积的思考文本，流式累加
  error: string; // 失败原因（error 状态时有值）
  start: <K extends AiStreamMethod>(
    method: K,
    data: GetDataType<ProtocolMap[K]>,
  ) => Promise<void>; // 发起一次流式生成
  cancel: () => void; // 取消进行中的生成并回到空闲态
}

// 从后台推送信封解析流式事件：结构不合法或非本通道消息返回 null
const readStreamEvent = (message: unknown): AiStreamEvent | null => {
  const parsed = aiStreamEventSchema.safeParse(
    readProperty(message, 'hiJobStream'),
  );
  return parsed.success ? parsed.data : null;
};

// 消费后台流式推送：发起生成后按 requestId 关联增量与终态，空闲超时自动取消
const useAiStream = (): UseAiStreamResult => {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [text, setText] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [error, setError] = useState('');

  const requestIdRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // 清除空闲计时器
  const clearIdleTimer = useCallback((): void => {
    if (idleTimerRef.current !== undefined) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = undefined;
    }
  }, []);

  // 终止在途请求并清空关联状态
  const teardown = useCallback((): void => {
    const requestId = requestIdRef.current;
    requestIdRef.current = null;
    clearIdleTimer();
    if (requestId !== null) {
      void sendMessage('cancelAiStream', requestId).catch(() => {});
    }
  }, [clearIdleTimer]);

  // 空闲超时：取消在途生成并进入失败态
  const handleIdleTimeout = useCallback((): void => {
    teardown();
    setStatus('error');
    setError('生成超时：模型长时间无响应，请重试');
  }, [teardown]);

  // 重置空闲计时：首包与中途断流共用一套计时，仅窗口不同
  const armIdleTimer = useCallback(
    (timeoutMs: number): void => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        handleIdleTimeout();
      }, timeoutMs);
    },
    [clearIdleTimer, handleIdleTimeout],
  );

  // 取消进行中的生成并回到空闲态
  const cancel = useCallback((): void => {
    teardown();
    setStatus('idle');
    setText('');
    setReasoning('');
    setError('');
  }, [teardown]);

  // 发起一次流式生成：成功拿到 requestId 后进入生成态，失败直接进失败态
  const start = useCallback(
    async <K extends AiStreamMethod>(
      method: K,
      data: GetDataType<ProtocolMap[K]>,
    ): Promise<void> => {
      teardown();
      setText('');
      setReasoning('');
      setError('');
      setStatus('streaming');
      try {
        const { requestId } = await sendMessage(method, data);
        requestIdRef.current = requestId;
        armIdleTimer(FIRST_CHUNK_TIMEOUT_MS);
      } catch (caught) {
        requestIdRef.current = null;
        setStatus('error');
        setError(caught instanceof Error ? caught.message : '生成失败');
      }
    },
    [armIdleTimer, teardown],
  );

  // 后台推送监听：挂在组件生命周期内，按 requestId 过滤并推进状态机
  useEffect(() => {
    const listener = (message: unknown): void => {
      if (requestIdRef.current === null) {
        return;
      }
      const event = readStreamEvent(message);
      if (event === null || event.requestId !== requestIdRef.current) {
        return;
      }
      // 思考增量：累加到思考文本并刷新断流计时，避免长思考被误判断流
      if (event.kind === 'reasoning') {
        setReasoning((previous) => previous + event.delta);
        armIdleTimer(CHUNK_GAP_TIMEOUT_MS);
        return;
      }
      if (event.kind === 'chunk') {
        setText((previous) => previous + event.delta);
        armIdleTimer(CHUNK_GAP_TIMEOUT_MS);
        return;
      }
      requestIdRef.current = null;
      clearIdleTimer();
      if (event.kind === 'end') {
        setText(event.text);
        setStatus('done');
        return;
      }
      setStatus('error');
      setError(event.message);
    };
    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, [armIdleTimer, clearIdleTimer]);

  // 组件卸载时终止在途请求，避免后台空跑
  useEffect(() => teardown, [teardown]);

  return { status, text, reasoning, error, start, cancel };
};

export type { AiStreamMethod, StreamStatus };
export { useAiStream };
