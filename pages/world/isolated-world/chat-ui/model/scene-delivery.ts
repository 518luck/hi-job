// # 场景投递（聊天 UI）：四场景生成完成后，按工作台开关自动填入 Boss 输入框（可选发送）
//
// 每次生成到终态时现拉偏好：工作台改开关即时生效，无需刷新聊天页。
// 问候（手动点按钮或去沟通自动触发）跟随去沟通行的「发送」开关；auto-greet 只负责触发，投递统一走这里。

import { useEffect, useRef } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { debugLog } from '@/shared/lib/debug-log';
import type { SceneDelivery } from '@/shared/zod';

import { deliverChatText } from './chat-delivery';
import type { AiStreamMethod, StreamStatus } from './use-ai-stream';

// useSceneDelivery 入参
interface UseSceneDeliveryOptions {
  bodyStatus: StreamStatus; // 正文流式状态：done 时判定投递
  text: string; // 生成终态全文
  lastMethod: AiStreamMethod | null; // 最近场景方法：决定查哪组开关
}

// 读取某场景的投递开关：偏好拉取失败或未配置返回 null（不投递）
const readSceneDelivery = async (
  method: AiStreamMethod,
): Promise<SceneDelivery | null> => {
  const preference = await sendMessage('getAiPreference', undefined).catch(
    () => null,
  );
  if (preference === null) {
    debugLog('scene-delivery', '读取 AI 偏好失败，跳过投递');
    return null;
  }
  // 问候没有独立场景开关：跟随去沟通行的「发送」，手动与自动触发同享
  if (method === 'greeting') {
    const send = preference.autoSendGreeting;
    return { fill: send, send };
  }
  return preference.sceneDelivery[method] ?? null;
};

// 场景投递 Hook：各场景生成 done 后按开关填入/发送
const useSceneDelivery = ({
  bodyStatus,
  text,
  lastMethod,
}: UseSceneDeliveryOptions): void => {
  // 最新终态快照：偏好拉取异步往返，回来后核对仍是同一份终态才投递
  const latestRef = useRef({ bodyStatus, text, lastMethod });
  latestRef.current = { bodyStatus, text, lastMethod };

  useEffect(() => {
    if (bodyStatus !== 'done' || lastMethod === null) {
      return;
    }
    void readSceneDelivery(lastMethod).then((option) => {
      if (option === null || !option.fill) {
        return;
      }
      // 往返期间用户可能已重新生成或切换场景：终态变了就不投旧文本
      const latest = latestRef.current;
      if (
        latest.bodyStatus !== 'done' ||
        latest.text !== text ||
        latest.lastMethod !== lastMethod
      ) {
        return;
      }
      void deliverChatText({ text, autoSend: option.send });
    });
  }, [bodyStatus, text, lastMethod]);
};

export { useSceneDelivery };
