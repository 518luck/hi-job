import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';

// 右侧菜单栏的导航配置
const NAV_ITEMS = [
  { key: 'workbench', label: '工作台', icon: Icons.workbench },
  { key: 'records', label: '记录', icon: Icons.notebook },
  { key: 'aiVendors', label: 'AI 厂商', icon: Icons.aiVendors },
  { key: 'settings', label: '设置', icon: Icons.settings },
  { key: 'debug', label: '调试', icon: Icons.debug },
] as const;

// 导航项的唯一标识
type NavKey = (typeof NAV_ITEMS)[number]['key'];

// 右侧图标菜单栏的 props
interface NavBarProps {
  activeKey: NavKey;
  onSelect: (key: NavKey) => void;
}

// 右侧图标菜单栏：点击切换左侧内容区的页面
function NavBar({ activeKey, onSelect }: NavBarProps) {
  return (
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
          onClick={() => onSelect(key)}
        >
          <Icon />
        </Button>
      ))}
    </nav>
  );
}

export { NavBar, type NavKey };
