import { useState } from 'react';

// localStorage 键：工作台已选厂商与模型 id，未选择时不存键
const VENDOR_ID_KEY = 'workbench.vendorId';
const MODEL_ID_KEY = 'workbench.modelId';

// 持久化厂商选择：null 时移除键，避免残留失效 id
const persistVendorId = (vendorId: string | null): void => {
  if (vendorId === null) {
    localStorage.removeItem(VENDOR_ID_KEY);
  } else {
    localStorage.setItem(VENDOR_ID_KEY, vendorId);
  }
};

// 持久化模型选择：null 时移除键
const persistModelId = (modelId: string | null): void => {
  if (modelId === null) {
    localStorage.removeItem(MODEL_ID_KEY);
  } else {
    localStorage.setItem(MODEL_ID_KEY, modelId);
  }
};

// 工作台生成配置选择：选择即持久化，重开扩展后恢复上次的厂商与模型
const usePersistedVendorSelection = (): {
  vendorId: string | null;
  modelId: string | null;
  selectVendor: (vendorId: string | null) => void;
  selectModel: (modelId: string | null) => void;
} => {
  const [vendorId, setVendorId] = useState<string | null>(() =>
    localStorage.getItem(VENDOR_ID_KEY),
  );
  const [modelId, setModelId] = useState<string | null>(() =>
    localStorage.getItem(MODEL_ID_KEY),
  );

  // 切换厂商：清空模型选择，由页面回退逻辑自动选中该厂商第一个模型
  const selectVendor = (next: string | null): void => {
    setVendorId(next);
    setModelId(null);
    persistVendorId(next);
    persistModelId(null);
  };

  // 选择模型：更新状态并持久化
  const selectModel = (next: string | null): void => {
    setModelId(next);
    persistModelId(next);
  };

  return { vendorId, modelId, selectVendor, selectModel };
};

export { usePersistedVendorSelection };
