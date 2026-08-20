// # 自动问候触发（聊天 UI）：消费去沟通标记，开关开启时自动开窗发起「问候」
//
// 侧边栏「去沟通」→ 详情页自动点击前写入标记 → 跳转聊天页后本 Hook 挂载即消费；
// 开关开启时自动展开聊天窗并发起「问候」。生成完成后的填入/发送统一由 scene-delivery
// 按去沟通行「发送」开关处理（手动问候同享），本 Hook 只负责触发、不做投递。

import { useEffect, useRef } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { consumeAutoGreetMarker } from '@/shared/lib/auto-greet-marker';
import { debugLog } from '@/shared/lib/debug-log';
import { waitForVisible } from '@/shared/lib/page-interaction';

import { requestChatContext } from './chat-context';
import { locateChatInput } from './chat-delivery';

// Boss 输入框就绪等待：去沟通刚落到聊天页时输入区可能尚未渲染
const CHAT_INPUT_READY_TIMEOUT_MS = 10_000;

// useAutoGreet 入参
interface UseAutoGreetOptions {
  onTrigger: () => void; // 自动触发动作：由调用方展开聊天窗并发起「问候」
}

// 自动问候触发 Hook：挂载时一次性消费标记并判定触发
const useAutoGreet = ({ onTrigger }: UseAutoGreetOptions): void => {
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
      onTriggerRef.current();
    })();
  }, []);
};

export { useAutoGreet };
