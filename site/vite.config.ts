import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages 项目站部署在 /hi-job/ 子路径
export default defineConfig({
  base: '/hi-job/',
  plugins: [react(), tailwindcss()],
});
