// # 自动问候编排（聊天 UI）：消费去沟通标记，开关开启时自动开窗生成问候并投递到页面输入框
//
// 侧边栏「去沟通」→ 详情页自动点击前写入标记 → 跳转聊天页后本 Hook 挂载即消费；
// 开关①开启时自动展开聊天窗并发起「问候」，生成完成后填入 Boss 输入框，开关②决定是否自动发送。

import { useEffect, useRef } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { consumeAutoGreetMarker } from '@/shared/lib/auto-greet-marker';
import { debugLog } from '@/shared/lib/debug-log';
import { waitForVisible } from '@/shared/lib/page-interaction';

import { requestChatContext } from './chat-context';
import { deliverGreeting, locateChatInput } from './greeting-delivery';
import type { AiStreamMethod, StreamStatus } from './use-ai-stream';

// Boss 输入框就绪等待：去沟通刚落到聊天页时输入区可能尚未渲染
const CHAT_INPUT_READY_TIMEOUT_MS = 10_000;

// 进行中的自动会话：生成完成后据此判定是否投递（手动点「问候」不投递）
interface AutoGreetSession {
  autoSend: boolean; // 生成完成后是否自动发送
}

// useAutoGreet 入参
interface UseAutoGreetOptions {
  onTrigger: () => void; // 自动触发动作：由调用方展开聊天窗并发起「问候」
  bodyStatus: StreamStatus; // 正文流式状态：done 触发投递，error 作废会话
  text: string; // 生成终态全文
  lastMethod: AiStreamMethod | null; // 最近场景方法：仅问候场景投递
}

// 自动问候 Hook：挂载时一次性消费标记并判定触发；终态驱动投递
const useAutoGreet = ({
  onTrigger,
  bodyStatus,
  text,
  lastMethod,
}: UseAutoGreetOptions): void => {
  const sessionRef = useRef<AutoGreetSession | null>(null);
  // 触发动作走 ref：挂载效应保持零依赖，一次性消费不被后续渲染重启
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  // 挂载消费标记：读开关 → 等输入区就绪 → 守卫 → 触发自动问候
  useEffect(() => {
    void (async () => {
      if (!consumeAutoGreetMarker()) {
        return;
      }
      const preference = await sendMessage('getAiPreference', undefined).catch(
        () => null,
      );
      if (preference === null) {
        debugLog('auto-greet', '读取 AI 偏好失败，放弃自动问候');
        return;
      }
      if (!preference.autoGreetOnGoChat) {
        return;
      }
      const input = await waitForVisible({
        locate: locateChatInput,
        timeoutMs: CHAT_INPUT_READY_TIMEOUT_MS,
      });
      if (input === null) {
        debugLog('auto-greet', '聊天页输入框未就绪，放弃自动问候');
        return;
      }
      // 守卫：对方已有回复时再发问候不合时宜，跳过
      const context = await requestChatContext().catch(() => null);
      if (context?.messages.at(-1)?.role === 'friend') {
        debugLog('auto-greet', '对方已有回复，跳过自动问候');
        return;
      }
      sessionRef.current = { autoSend: preference.autoSendGreeting };
      onTriggerRef.current();
    })();
  }, []);

  // 终态驱动投递：done 且本次为自动触发的问候 → 填入输入框（可选发送）
  // 回到 idle（关窗取消会置回 idle）或 error 一律作废会话，避免残留到后续手动生成误投递
  useEffect(() => {
    const session = sessionRef.current;
    if (session === null) {
      return;
    }
    if (bodyStatus === 'done') {
      sessionRef.current = null;
      if (lastMethod === 'greeting') {
        void deliverGreeting({ text, autoSend: session.autoSend });
      }
      return;
    }
    if (bodyStatus === 'idle' || bodyStatus === 'error') {
      sessionRef.current = null;
    }
  }, [bodyStatus, text, lastMethod]);
};

export { useAutoGreet };
