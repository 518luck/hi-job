import { useTheme } from 'next-themes';
import { Icons } from '@/shared/ui/icons';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

// 主题切换选项
const THEME_OPTIONS = [
  { value: 'light', label: '浅色', icon: Icons.themeLight },
  { value: 'dark', label: '深色', icon: Icons.themeDark },
  { value: 'system', label: '跟随系统', icon: Icons.themeSystem },
] as const;

// 设置页
function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">设置</h2>
      <ToggleGroup
        variant="outline"
        value={theme ? [theme] : []}
        onValueChange={(values) => {
          const next = values[0];
          if (next) {
            setTheme(next);
          }
        }}
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            title={label}
            aria-label={label}
          >
            <Icon data-icon="inline-start" />
            <span>{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export { SettingsPage };
