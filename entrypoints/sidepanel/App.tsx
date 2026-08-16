import { useState } from 'react';

import { AiVendorsPage } from '@/pages/ai-vendors';
import { DebugPage } from '@/pages/debug';
import { FavoritesPage } from '@/pages/favorites';
import { SettingsPage } from '@/pages/settings';
import { WorkbenchPage } from '@/pages/workbench';
import { NavBar, type NavKey } from '@/widgets/nav-bar';

// 侧边栏主界面：左侧内容区 + 右侧菜单栏
function App() {
  const [activeKey, setActiveKey] = useState<NavKey>('workbench');

  return (
    <div className="flex h-screen">
      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeKey === 'workbench' && (
          <WorkbenchPage onNavigate={setActiveKey} />
        )}
        {activeKey === 'favorites' && <FavoritesPage />}
        {activeKey === 'aiVendors' && <AiVendorsPage />}
        {activeKey === 'settings' && <SettingsPage />}
        {activeKey === 'debug' && <DebugPage />}
      </main>
      <NavBar activeKey={activeKey} onSelect={setActiveKey} />
    </div>
  );
}

export default App;
