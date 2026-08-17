import { useState } from 'react';

import { AiVendorsPage } from '@/pages/ai-vendors';
import { DebugPage } from '@/pages/debug';
import { RecordsPage } from '@/pages/records';
import type { SettingsSection } from '@/pages/settings';
import { SettingsPage } from '@/pages/settings';
import { WorkbenchPage } from '@/pages/workbench';
import { NavBar, type NavKey } from '@/widgets/nav-bar';

// 侧边栏主界面：左侧内容区 + 右侧菜单栏
function App() {
  const [activeKey, setActiveKey] = useState<NavKey>('workbench');
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection | null>(null);

  // 导航切换：清空设置页聚焦标记，避免下次进入残留定位
  const navigate = (key: NavKey): void => {
    setSettingsSection(null);
    setActiveKey(key);
  };

  // 从工作台打开屏蔽公司：切到设置页并滚动定位到屏蔽公司区块
  const openBlockedCompanies = (): void => {
    setSettingsSection('blockedCompanies');
    setActiveKey('settings');
  };

  return (
    <div className="flex h-screen">
      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeKey === 'workbench' && (
          <WorkbenchPage
            onNavigate={navigate}
            onOpenBlockedCompanies={openBlockedCompanies}
          />
        )}
        {activeKey === 'records' && <RecordsPage />}
        {activeKey === 'aiVendors' && <AiVendorsPage />}
        {activeKey === 'settings' && (
          <SettingsPage
            focusSection={settingsSection}
            onSectionFocused={() => {
              setSettingsSection(null);
            }}
          />
        )}
        {activeKey === 'debug' && <DebugPage />}
      </main>
      <NavBar activeKey={activeKey} onSelect={navigate} />
    </div>
  );
}

export default App;
