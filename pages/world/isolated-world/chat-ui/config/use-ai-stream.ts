// # 流式消费常量：空闲超时判定

// 首 chunk 超时：模型首 token 前的等待上限（思考型模型首包偏慢）
export const FIRST_CHUNK_TIMEOUT_MS = 30_000;

// chunk 间隔超时：流中途卡死的判定
export const CHUNK_GAP_TIMEOUT_MS = 15_000;

// 计时心跳间隔：流式期间驱动顶栏 total 实时跳动
export const TIMING_TICK_MS = 200;
