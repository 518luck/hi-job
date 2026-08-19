// # 思考短语挑选：从配置短语池按当前时间桶随机取一条，仿 Claude Code spinnerVerbs 的趣味

import {
  THINKING_PHRASE_INTERVAL_MS,
  THINKING_PHRASES,
} from '../config/thinking-phrases';

// 时间桶散列：把桶号打散到全值域，让相邻桶的短语看起来互不相关
const hashThinkingBucket = (bucket: number): number => {
  let value = bucket;
  value = value ^ 61 ^ (value >>> 16);
  value = value + (value << 3);
  value = value ^ (value >>> 4);
  value = Math.imul(value, 0x27d4eb2d);
  value = value ^ (value >>> 15);
  return value >>> 0;
};

// 按当前时间取短语：每 THINKING_PHRASE_INTERVAL_MS 毫秒重新随机一条，
// 同一时间桶内结果稳定（重渲染不闪烁），跨轮次起点也不固定
const pickThinkingPhrase = (nowMs: number): string =>
  THINKING_PHRASES[
    hashThinkingBucket(Math.floor(nowMs / THINKING_PHRASE_INTERVAL_MS)) %
      THINKING_PHRASES.length
  ] ?? '思考中';

export { pickThinkingPhrase };
