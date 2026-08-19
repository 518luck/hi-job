// # 场景俏皮话挑选：每轮发起场景时从配置池随机挑一条，轮内保持稳定

import { SCENE_PHRASES } from '../config/scene-phrases';
import type { AiStreamMethod } from './use-ai-stream';

// 按场景随机挑一条俏皮话：每轮发起时调用一次并存入状态，轮内保持稳定
const pickScenePhrase = (method: AiStreamMethod): string => {
  const phrases = SCENE_PHRASES[method];
  return phrases[Math.floor(Math.random() * phrases.length)] ?? '';
};

export { pickScenePhrase };
