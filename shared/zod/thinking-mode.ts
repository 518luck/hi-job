// # thinking-mode 表数据字典：AI 调用的思考模式设置
import { z } from 'zod';

// 思考模式档位：default 不传任何参数，off 显式禁用思考，low/medium/high 递增强度
const THINKING_MODES = ['default', 'off', 'low', 'medium', 'high'] as const;

// 表 thinkingMode（思考模式设置）落库实体：主键 key，单行
const thinkingModeSchema = z.object({
  key: z.literal('global'), // 单行固定主键
  mode: z.enum(THINKING_MODES), // 思考模式档位
});

// 协议传输的思考模式：去掉存储主键，只留档位
const thinkingModeInputSchema = thinkingModeSchema.omit({ key: true });

// 从 schema 派生类型，保持单一事实来源
type ThinkingMode = z.infer<typeof thinkingModeSchema>['mode'];
type ThinkingModeSetting = z.infer<typeof thinkingModeSchema>;
type ThinkingModeInput = z.infer<typeof thinkingModeInputSchema>;

export type { ThinkingMode, ThinkingModeInput, ThinkingModeSetting };
export { THINKING_MODES, thinkingModeInputSchema, thinkingModeSchema };
