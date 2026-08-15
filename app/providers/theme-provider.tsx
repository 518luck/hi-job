import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ComponentProps } from 'react';

// 主题 Provider：next-themes 薄封装，统一管理明/暗样式切换
type ThemeProviderProps = ComponentProps<typeof NextThemeProvider>;

function ThemeProvider(props: ThemeProviderProps) {
  return <NextThemeProvider {...props} />;
}

export { ThemeProvider };
