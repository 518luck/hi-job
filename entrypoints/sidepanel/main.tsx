import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/app/app.css';
import App from './App.tsx';

// 挂载点不存在时直接退出，避免非空断言
const rootElement = document.querySelector<HTMLElement>('#root');
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
