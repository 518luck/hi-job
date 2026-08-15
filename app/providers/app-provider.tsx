import type { PropsWithChildren } from 'react';

// 全局 Provider 组合根：新增全局上下文（主题、数据、配置等）时在此逐层包裹
function AppProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export { AppProvider };
