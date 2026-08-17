import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

import { Icons } from '@/shared/ui/icons';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { DISCLAIMER_PARAGRAPHS } from '@/widgets/disclaimer-dialog';

import { BlockedCompanyInput } from './blocked-company-input';
import { StorageUsageSection } from './storage-usage';

// 设置页可聚焦区块：外部导航进入时滚动定位
type SettingsSection = 'blockedCompanies';

// 设置页的 props
interface SettingsPageProps {
  focusSection?: SettingsSection | null; // 进入时聚焦的区块
  onSectionFocused?: () => void; // 聚焦完成后的清除回调
}

// 主题切换选项
const THEME_OPTIONS = [
  { value: 'light', label: '浅色', icon: Icons.themeLight },
  { value: 'dark', label: '深色', icon: Icons.themeDark },
  { value: 'system', label: '跟随系统', icon: Icons.themeSystem },
] as const;

// 设置页：主题切换、屏蔽公司、存储占用；支持外部导航定位到指定区块
function SettingsPage({ focusSection, onSectionFocused }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const blockedSectionRef = useRef<HTMLElement>(null);

  // 聚焦指定区块：平滑滚动定位后回调清除，避免重复触发
  useEffect(() => {
    if (focusSection !== 'blockedCompanies') {
      return;
    }
    blockedSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    onSectionFocused?.();
  }, [focusSection, onSectionFocused]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h2 className="text-base font-medium">设置</h2>
      <section className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">主题</span>
        <ToggleGroup
          variant="outline"
          className="w-full"
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
              className="flex-1"
              title={label}
              aria-label={label}
            >
              <Icon data-icon="inline-start" />
              <span>{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <section ref={blockedSectionRef} className="flex flex-col gap-2">
        <BlockedCompanyInput />
        {/* // ! 包含匹配的误伤提醒：短词会遮住所有含该词的公司，提醒用户用全称规避 */}
        <div className="border border-amber-300/60 bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
          注意：包含匹配可能误伤——短词会遮住名字里含该词的所有公司（如「微创」也会遮「微创医疗」）。被遮卡片上会显示命中词与公司原名，便于二次辨认；发现误伤请删除短词，改用更长的全称（如「微创软件」「广州云链」）。
        </div>
      </section>
      <StorageUsageSection />
      {/* 免责声明：固定在设置页底部，与启动弹窗共用同一份文案 */}
      <section className="mt-auto flex flex-col gap-1.5 pt-2">
        <span className="text-sm text-muted-foreground">免责声明</span>
        {DISCLAIMER_PARAGRAPHS.map((paragraph) => (
          <p
            key={paragraph}
            className="text-xs leading-relaxed text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
      </section>
    </div>
  );
}

export type { SettingsSection };
export { SettingsPage };
