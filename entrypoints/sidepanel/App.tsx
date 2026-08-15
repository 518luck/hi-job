import { useState } from 'react';
import { Briefcase, Settings, Star } from 'lucide-react';
import { FavoritesPage } from '@/pages/favorites/favorites-page';
import { JobsPage } from '@/pages/jobs/jobs-page';
import { SettingsPage } from '@/pages/settings/settings-page';
import { Button } from '@/shared/ui/button';

// 右侧菜单栏的导航配置
const NAV_ITEMS = [
  { key: 'jobs', label: '职位', icon: Briefcase },
  { key: 'favorites', label: '收藏', icon: Star },
  { key: 'settings', label: '设置', icon: Settings },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

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
      <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-l py-2">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            aria-current={activeKey === key ? 'page' : undefined}
            className="aria-[current=page]:bg-muted"
            onClick={() => setActiveKey(key)}
          >
            <Icon />
          </Button>
        ))}
      </nav>
    </div>
  );
}

export default App;
