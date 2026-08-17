// # debug-log 消息数据字典：页面采集日志查询的跨环境 DTO
import { z } from 'zod';

// 页面采集日志行数组：内容脚本从隐藏 DOM 读出的原始日志条目
const debugLogLinesSchema = z.array(z.string());

// 从 schema 派生类型，保持单一事实来源
type DebugLogLines = z.infer<typeof debugLogLinesSchema>;

export type { DebugLogLines };
export { debugLogLinesSchema };
