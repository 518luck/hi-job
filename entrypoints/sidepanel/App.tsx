import { useState } from 'react';

import { AiVendorsPage } from '@/pages/ai-vendors';
import { FavoritesPage } from '@/pages/favorites';
import { JobsPage } from '@/pages/jobs';
import { SettingsPage } from '@/pages/settings';
import { NavBar, type NavKey } from '@/widgets/nav-bar';

// 侧边栏主界面：左侧内容区 + 右侧菜单栏
function App() {
  const [activeKey, setActiveKey] = useState<NavKey>('jobs');

  return (
    <div className="flex h-screen">
      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeKey === 'jobs' && <JobsPage onNavigate={setActiveKey} />}
        {activeKey === 'favorites' && <FavoritesPage />}
        {activeKey === 'aiVendors' && <AiVendorsPage />}
        {activeKey === 'settings' && <SettingsPage />}
      </main>
      <NavBar activeKey={activeKey} onSelect={setActiveKey} />
    </div>
  );
}

export default App;
