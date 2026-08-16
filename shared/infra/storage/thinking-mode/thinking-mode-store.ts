// # thinking-mode 领域仓储：思考模式设置（单行）的统一读写入口
import type { ThinkingMode } from '@/shared/zod';

import { db } from '../db';

// 单行固定主键：思考模式全局只有一份
const THINKING_MODE_KEY = 'global';

// 默认思考模式：不传任何参数，保持既有行为
const DEFAULT_THINKING_MODE: ThinkingMode = 'default';

// 保存思考模式：单行覆盖写入
const saveThinkingMode = async (mode: ThinkingMode): Promise<void> => {
  await db.thinkingMode.put({ key: THINKING_MODE_KEY, mode });
};

// 读取思考模式：无记录时返回默认档
const readThinkingMode = async (): Promise<ThinkingMode> => {
  const record = await db.thinkingMode.get(THINKING_MODE_KEY);
  return record?.mode ?? DEFAULT_THINKING_MODE;
};

// thinking-mode 领域仓储：思考模式设置（单行）的统一读写入口
const thinkingModeStore = {
  saveThinkingMode, // 保存思考模式
  readThinkingMode, // 读取思考模式（无记录时默认档）
};

export { DEFAULT_THINKING_MODE, thinkingModeStore };
