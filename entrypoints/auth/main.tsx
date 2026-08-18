import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppProvider } from '@/app/providers/app-provider';
import '@/app/app.css';
import { AuthPage } from '@/pages/auth';

// 从查询参数读取待授权的厂商地址
const origin = new URLSearchParams(window.location.search).get('origin') ?? '';

// 挂载点不存在时直接退出，避免非空断言
const rootElement = document.querySelector<HTMLElement>('#root');
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppProvider>
        <AuthPage origin={origin} />
      </AppProvider>
    </React.StrictMode>,
  );
}
