import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import './app.css';

// 落地页入口：挂载 App 到 #root
createRoot(document.getElementById('root') ?? document.body).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
