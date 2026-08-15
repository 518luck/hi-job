import { useState } from 'react';
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
        {activeKey === 'jobs' && <JobsPage />}
        {activeKey === 'favorites' && <FavoritesPage />}
        {activeKey === 'settings' && <SettingsPage />}
      </main>
      <NavBar activeKey={activeKey} onSelect={setActiveKey} />
    </div>
  );
}

export default App;
