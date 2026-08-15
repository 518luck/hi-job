import type { PropsWithChildren } from 'react';
import { ThemeProvider } from './theme-provider';

// 全局 Provider 组合根：新增全局上下文（数据、配置等）时在此逐层包裹
function AppProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

export { AppProvider };
