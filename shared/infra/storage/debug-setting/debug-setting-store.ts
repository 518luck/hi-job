// # debug-setting 领域仓储：调试开关的统一读写入口
import type { DebugSettings } from '@/shared/zod';
import { DEBUG_SETTING_KEY } from '@/shared/zod';

import { db } from '../db';

// 开关默认值：探测按钮默认关闭，需要时在调试页手动开启
const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  chatProbeEnabled: false,
  jdProbeEnabled: false,
  detailProbeEnabled: false,
};

// 保存调试设置：单行覆盖写入
const saveDebugSettings = async (settings: DebugSettings): Promise<void> => {
  await db.debugSetting.put({
    key: DEBUG_SETTING_KEY,
    ...settings,
  });
};

// 读取调试设置：无记录时返回默认值
const readDebugSettings = async (): Promise<DebugSettings> => {
  const record = await db.debugSetting.get(DEBUG_SETTING_KEY);
  if (record === undefined) {
    return DEFAULT_DEBUG_SETTINGS;
  }
  // 去掉存储主键，只返回开关字段；旧数据缺失的开关字段回退默认关闭
  return {
    chatProbeEnabled: record.chatProbeEnabled ?? false,
    jdProbeEnabled: record.jdProbeEnabled ?? false,
    detailProbeEnabled: record.detailProbeEnabled ?? false,
  };
};

// debug-setting 领域仓储：调试开关的统一读写入口
const debugSettingStore = {
  saveDebugSettings, // 保存调试设置
  readDebugSettings, // 读取调试设置（无记录时默认关闭）
};

export { DEFAULT_DEBUG_SETTINGS, debugSettingStore };
