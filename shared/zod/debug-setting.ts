// # debug-setting 表数据字典：调试功能开关设置
import { z } from 'zod';

// 单行固定主键：调试设置只有一份，key 恒为 global
const DEBUG_SETTING_KEY = 'global';

// 表 debugSetting（调试设置）落库实体：主键 key
const debugSettingSchema = z.object({
  key: z.literal(DEBUG_SETTING_KEY), // 单行固定主键
  chatProbeEnabled: z.boolean(), // 聊天页「探测聊天数据」按钮开关
  jdProbeEnabled: z.boolean(), // 职位页「探测职位数据」按钮开关
});

// 协议传输的调试设置：去掉存储主键，只传开关字段
const debugSettingsSchema = debugSettingSchema.omit({ key: true });

// 从 schema 派生类型，保持单一事实来源
type DebugSetting = z.infer<typeof debugSettingSchema>;
type DebugSettings = z.infer<typeof debugSettingsSchema>;

export type { DebugSetting, DebugSettings };
export { DEBUG_SETTING_KEY, debugSettingSchema, debugSettingsSchema };
