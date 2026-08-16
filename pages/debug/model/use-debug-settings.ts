import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import { DEFAULT_DEBUG_SETTINGS } from '@/shared/infra/storage';
import type { DebugSettings } from '@/shared/zod';

// 调试页开关状态：挂载时读取后台设置，切换时乐观更新并保存
const useDebugSettings = (): {
  settings: DebugSettings;
  setChatProbeEnabled: (enabled: boolean) => Promise<void>;
  setJdProbeEnabled: (enabled: boolean) => Promise<void>;
} => {
  const [settings, setSettings] = useState<DebugSettings>(
    DEFAULT_DEBUG_SETTINGS,
  );

  useEffect(() => {
    void sendMessage('getDebugSettings', undefined).then(setSettings);
  }, []);

  const update = async (patch: Partial<DebugSettings>): Promise<void> => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await sendMessage('saveDebugSettings', next);
  };

  return {
    settings,
    setChatProbeEnabled: (enabled) => update({ chatProbeEnabled: enabled }),
    setJdProbeEnabled: (enabled) => update({ jdProbeEnabled: enabled }),
  };
};

export { useDebugSettings };
