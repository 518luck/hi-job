import { useLiveQuery } from 'dexie-react-hooks';

import type { AiVendorRecord } from '@/shared/infra/storage';
import { aiVendorStore } from '@/shared/infra/storage';

// 工作台厂商数据：数据库变化时自动重新查询（按最近编辑倒序）
const useVendors = (): { vendors: AiVendorRecord[] } => {
  const query = useLiveQuery(() => aiVendorStore.readAllVendors(), []);

  return { vendors: query ?? [] };
};

export { useVendors };
