import { useLiveQuery } from 'dexie-react-hooks';

import { aiLogStore } from '@/shared/infra/storage';

// AI 用量统计：近 10 次吞吐与累计 token 消耗
interface AiRateStats {
  tpm?: number; // 近 10 次成功调用的 token 吞吐（tokens/分钟）
  totalTokens?: number; // 全部日志的累计 token 消耗（输入+输出），无 token 数据时缺省
}

// 调试页 AI 用量：从日志库统计吞吐与消耗，库变化自动刷新
const useAiRateStats = (): AiRateStats => {
  const logs = useLiveQuery(() => aiLogStore.listAiLogs(), []);

  if (logs === undefined || logs.length === 0) {
    return {};
  }
  // 近 10 次中有 token 数据的调用：TPM 的统计口径（失败调用不会记录 token）
  const tokenLogs = logs
    .filter((log) => log.outputTokens !== undefined)
    .slice(0, 10);
  const tokenMs = tokenLogs.reduce((sum, log) => sum + log.durationMs, 0);
  const tokenTotal = tokenLogs.reduce(
    (sum, log) => sum + (log.inputTokens ?? 0) + (log.outputTokens ?? 0),
    0,
  );
  // 全部日志都不含 token 数据（升级前历史）时消耗缺省，避免显示误导性的 0
  const tracked = logs.some(
    (log) => log.inputTokens !== undefined || log.outputTokens !== undefined,
  );
  const totalTokens = logs.reduce(
    (sum, log) => sum + (log.inputTokens ?? 0) + (log.outputTokens ?? 0),
    0,
  );

  return {
    tpm: tokenMs > 0 ? (tokenTotal / tokenMs) * 60_000 : undefined,
    totalTokens: tracked ? totalTokens : undefined,
  };
};

export { useAiRateStats };
