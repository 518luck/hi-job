# hi-job 下载站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 hi-job 扩展搭建 GitHub Releases 发布流水线与 GitHub Pages 中文产品落地页。

**Architecture:** 仓库新增 `site/` 独立 Vite + React 19 站点（零耦合扩展代码），两个独立 workflow：打 `v*` tag 构建 zip 发 Release（产物重命名固定名），`site/**` 变更时构建并部署 Pages。设计依据 `docs/superpowers/specs/2026-08-18-download-site-design.md`。

**Tech Stack:** Vite、React 19、TypeScript、Tailwind CSS v4（`@tailwindcss/vite`）、lucide-react、GitHub Actions（`actions/deploy-pages`、`softprops/action-gh-release`）。

## Global Constraints

- 文案全部简体中文；新文件名 kebab-case；React 组件 `function` 声明，hook 与工具函数 `const` 箭头函数
- 所有函数/组件/导出常量上方一行简短中文注释；注释只写「现在做什么」
- 根 biome（单引号、2 空格缩进、`useIgnoreFile: true`）会检查 `site/`：每任务收尾从仓库根跑 `pnpm run fix`
- 仓库惯例 `.gitignore` 忽略 `pnpm-lock.yaml`：CI 一律 `pnpm install --no-frozen-lockfile`，禁用依赖缓存配置
- 扩展侧代码（entrypoints/pages/shared/widgets）零改动；唯一例外是 Task 7 的 README
- 下载产物固定文件名 `hi-job-chrome.zip`；固定直链 `https://github.com/518luck/hi-job/releases/latest/download/hi-job-chrome.zip`
- Vite `base` 必须为 `'/hi-job/'`（GitHub Pages 项目子路径）
- 项目无测试设施（spec 规定）：每任务的「测试循环」= site 内 `pnpm build` + `pnpm typecheck` 通过、`pnpm dev` 预览检查、仓库根 `pnpm run fix` 无报错；流水线端到端以打 `v0.1.0` tag 验证
- 组件间传递多个参数时用参数对象解构（Options Object 规则）
- TypeScript 禁 `any`、禁 `as` 断言（`as const` 除外）、禁非空断言

---

### Task 1: site 站点脚手架与主题基座

**Files:**
- Create: `site/package.json`（骨架手写，依赖经命令安装）
- Create: `site/vite.config.ts`、`site/tsconfig.json`、`site/index.html`
- Create: `site/src/main.tsx`、`site/src/app.tsx`（临时占位）、`site/src/app.css`
- Create: `site/src/lib/utils.ts`、`site/src/lib/site.ts`
- Create: `site/public/screenshots/.gitkeep`、`site/.gitignore`

**Interfaces:**
- Consumes: 无（首任务）
- Produces（后续任务全部依赖）:
  - `cn(...inputs: ClassValue[]): string`（`site/src/lib/utils.ts`）
  - 常量 `site/src/lib/site.ts`：`SITE_TITLE: string`、`REPO_URL = 'https://github.com/518luck/hi-job'`、`DOWNLOAD_URL = 'https://github.com/518luck/hi-job/releases/latest/download/hi-job-chrome.zip'`、`API_LATEST_RELEASE = 'https://api.github.com/repos/518luck/hi-job/releases/latest'`、`ISSUES_URL = 'https://github.com/518luck/hi-job/issues'`
  - 默认导出 `App` 组件（`site/src/app.tsx`），后续任务往其中追加 section
  - 主题工具类可用：`bg-background text-foreground bg-card border-border text-muted-foreground bg-primary text-primary-foreground` 等（shadcn 语义色）

- [ ] **Step 1: 建目录与 package.json 骨架**

```bash
mkdir -p site/src/lib site/src/hooks site/src/components site/public/screenshots
touch site/public/screenshots/.gitkeep
```

`site/.gitignore`（根 `.gitignore` 无 `dist` 规则，构建产物必须在这里挡住）：

```gitignore
node_modules
dist
```

`site/package.json`：

```json
{
  "name": "hi-job-site",
  "description": "更好用的 boss 直聘 · 产品落地页（GitHub Pages）",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: 安装依赖（版本由 registry 解析，不手写）**

```bash
cd site
pnpm add react react-dom lucide-react clsx tailwind-merge "@fontsource-variable/jetbrains-mono" tw-animate-css shadcn
pnpm add -D vite "@vitejs/plugin-react" typescript "@types/react" "@types/react-dom" tailwindcss "@tailwindcss/vite"
```

- [ ] **Step 3: 写配置与入口文件**

`site/vite.config.ts`：

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages 项目站部署在 /hi-job/ 子路径
export default defineConfig({
  base: '/hi-job/',
  plugins: [react(), tailwindcss()],
});
```

`site/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`site/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>更好用的 boss 直聘 · 下载与安装</title>
    <meta
      name="description"
      content="BOSS直聘求职辅助扩展：AI 生成打招呼与回复、职位自动记录、HR 档案、屏蔽公司。免费开源，数据全部本地存储。"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`site/src/main.tsx`：

```tsx
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
```

`site/src/app.tsx`（Task 2 起逐步填入 section）：

```tsx
// 落地页组装：自上而下排列各区块
export function App() {
  return <main className="mx-auto max-w-5xl px-4 sm:px-6" />;
}
```

- [ ] **Step 4: 写工具与常量**

`site/src/lib/utils.ts`：

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并 Tailwind 类名（与扩展侧 cn 同实现）
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
```

`site/src/lib/site.ts`：

```ts
// 落地页全局常量：仓库与下载链接集中管理
export const SITE_TITLE = '更好用的 boss 直聘';
export const REPO_URL = 'https://github.com/518luck/hi-job';
export const DOWNLOAD_URL =
  'https://github.com/518luck/hi-job/releases/latest/download/hi-job-chrome.zip';
export const API_LATEST_RELEASE =
  'https://api.github.com/repos/518luck/hi-job/releases/latest';
export const ISSUES_URL = 'https://github.com/518luck/hi-job/issues';
```

- [ ] **Step 5: 写主题样式 app.css**

复制根 `app/app.css` 的变量体系，做三处调整：去掉 `@custom-variant dark`（不用 `.dark` 类）；`.dark { }` 变量块改为 `@media (prefers-color-scheme: dark) { :root { } }`；去掉 sidebar 相关变量（落地页无侧边栏）。保留 JetBrains Mono 本地字体与滚动条美化。完整文件：

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
/* lyra 风格签名字体：JetBrains Mono（本地打包，与扩展一致） */
@import "@fontsource-variable/jetbrains-mono";

@theme inline {
  /* lyra 预设：全局使用 JetBrains Mono（font: jetbrains-mono） */
  --font-sans:
    "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 6: 验证并提交**

```bash
cd site && pnpm build && pnpm typecheck && cd ..
pnpm run fix
pnpm --dir site run dev # 浏览器确认空白页正常、无控制台报错，Ctrl-C 退出
git add site
git commit -m "feat: 新增 site 落地页脚手架与主题基座"
```

预期：`vite build` 产出 `site/dist/`；typecheck 无错误；根 `pnpm run fix` 不报 site 文件问题。注意确认 `site/node_modules` 已被根 `.gitignore` 的 `node_modules` 规则覆盖（无斜杠目录名匹配任意层级，应被忽略），`git status` 里不得出现 `site/node_modules`。

---

### Task 2: 顶部导航、Hero 与版本号 hook

**Files:**
- Create: `site/src/hooks/use-latest-version.ts`
- Create: `site/src/components/site-header.tsx`、`site/src/components/download-button.tsx`、`site/src/components/hero-section.tsx`
- Modify: `site/src/app.tsx`

**Interfaces:**
- Consumes: `cn()`、`site.ts` 全部常量（Task 1）
- Produces:
  - `useLatestVersion(): { version: string; failed: boolean }`——`version` 形如 `'v0.1.0'`（GitHub `tag_name` 原样），失败时 `version === '' && failed === true`
  - `DownloadButton({ size = 'lg' }: { size?: 'lg' | 'md' })`——指向 `DOWNLOAD_URL` 的下载主按钮，Task 4 安装区复用
  - `SiteHeader`、`HeroSection` 组件

- [ ] **Step 1: 写版本号 hook**

`site/src/hooks/use-latest-version.ts`：

```ts
import { useEffect, useState } from 'react';
import { API_LATEST_RELEASE } from '../lib/site';

// 拉取 GitHub 最新 Release 的 tag 作为版本号展示；失败时置 failed 由调用方兜底
export const useLatestVersion = (): { version: string; failed: boolean } => {
  const [version, setVersion] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_LATEST_RELEASE, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { tag_name?: unknown }) => {
        if (typeof data.tag_name === 'string') setVersion(data.tag_name);
        else throw new Error('unexpected response shape');
      })
      .catch(() => setFailed(true));
    return () => controller.abort();
  }, []);

  return { version, failed };
};
```

- [ ] **Step 2: 写下载按钮组件**

`site/src/components/download-button.tsx`：

```tsx
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { DOWNLOAD_URL } from '../lib/site';

// 下载主按钮：指向永远最新的 Release 固定直链
export function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  return (
    <a
      href={DOWNLOAD_URL}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-85',
        size === 'lg' ? 'h-12 px-8 text-base' : 'h-9 px-4 text-sm',
      )}
    >
      <Download className="size-4" aria-hidden />
      下载 Chrome 版（zip）
    </a>
  );
}
```

- [ ] **Step 3: 写顶部导航与 Hero**

`site/src/components/site-header.tsx`：

```tsx
import { Github } from 'lucide-react';
import { REPO_URL, SITE_TITLE } from '../lib/site';

// 顶部导航：产品名 + GitHub 入口
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-4">
      <span className="text-sm font-semibold tracking-tight">{SITE_TITLE}</span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Github className="size-4" aria-hidden />
        GitHub
      </a>
    </header>
  );
}
```

`site/src/components/hero-section.tsx`：

```tsx
import { useLatestVersion } from '../hooks/use-latest-version';
import { REPO_URL } from '../lib/site';
import { DownloadButton } from './download-button';

// Hero 区：价值主张 + 下载主按钮 + 版本号与徽章
export function HeroSection() {
  const { version, failed } = useLatestVersion();

  return (
    <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        更好用的 boss 直聘
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        把求职过程的高频动作变得可控、可追踪——浏览过的职位自动记录，沟通中的
        HR 自动建档，AI 帮你生成打招呼与回复，不喜欢的公司一键屏蔽。最终是否沟通、是否发送，始终由你掌控。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="rounded-full border px-3 py-1">免费开源</span>
        <span className="rounded-full border px-3 py-1">数据本地存储</span>
        <span className="rounded-full border px-3 py-1">不上传任何服务器</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <DownloadButton />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center rounded-lg border px-8 text-base font-medium transition-colors hover:bg-accent"
        >
          查看源码
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        {failed ? '最新版本见 GitHub Releases' : version ? `当前版本 ${version}` : '正在获取版本…'}
        <span className="mx-2">·</span>
        下载不畅可稍后重试
      </p>
    </section>
  );
}
```

- [ ] **Step 4: 组装进 App**

`site/src/app.tsx` 整体替换为：

```tsx
import { HeroSection } from './components/hero-section';
import { SiteHeader } from './components/site-header';

// 落地页组装：自上而下排列各区块
export function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      <SiteHeader />
      <HeroSection />
    </main>
  );
}
```

- [ ] **Step 5: 验证并提交**

```bash
pnpm run fix
pnpm --dir site typecheck && pnpm --dir site build
pnpm --dir site run dev # 检查：标题/徽章/按钮渲染，版本号拉取或兜底文案出现
git add site
git commit -m "feat: 落地页顶部导航与 Hero 区"
```

---

### Task 3: 功能特性区与截图区

**Files:**
- Create: `site/src/components/feature-section.tsx`、`site/src/components/screenshot-section.tsx`
- Modify: `site/src/app.tsx`

**Interfaces:**
- Consumes: `cn()`（Task 1）、lucide 图标
- Produces: `FeatureSection`、`ScreenshotSection` 组件；截图约定路径 `site/public/screenshots/{workbench,chat,records}.png`（图片缺失时自动占位）

- [ ] **Step 1: 写功能特性区**

`site/src/components/feature-section.tsx`：

```tsx
import {
  Ban,
  ClipboardList,
  MessagesSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// 功能卡片数据：图标 + 标题 + 描述 + 要点
const FEATURES: { icon: LucideIcon; title: string; description: string; points: readonly string[] }[] = [
  {
    icon: Sparkles,
    title: 'AI 求职助手',
    description: '结合职位、HR 档案与你的简历，AI 生成打招呼与回复。',
    points: [
      '10 家厂商预设一键启用，也支持自定义接口',
      '打招呼 / 回复 / 跟进 / 请教反馈四种场景',
      '思考模式五档切换，用量统计完整记录',
    ],
  },
  {
    icon: ClipboardList,
    title: '职位自动记录',
    description: '点开过的职位自动全字段入库，转头就忘成为历史。',
    points: [
      '职位名、薪资、公司、JD、标签等全字段记录',
      '列表卡片直接显示公司规模，外包一眼可辨',
      '工作台实时显示当前职位的公司信息',
    ],
  },
  {
    icon: MessagesSquare,
    title: 'HR 沟通管理',
    description: '聊天页自动建档，谁是谁、聊到哪，一目了然。',
    points: [
      'HR 姓名、头衔、公司、最后消息自动同步',
      '一键 Pass 后会话盖遮罩，不再打扰',
      '超过一天未回复自动标记提醒',
    ],
  },
  {
    icon: Ban,
    title: '屏蔽公司',
    description: '不想投的公司，从列表里消失。',
    points: [
      '名单式管理，支持批量粘贴与模板导入',
      '命中即遮罩，显示命中词与公司原名',
      '公司信息卡上一键屏蔽当前公司',
    ],
  },
];

// 功能特性区：四大能力卡片网格
export function FeatureSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        把琐碎动作收拢到侧边栏
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description, points }) => (
          <div
            key={title}
            className="rounded-xl border bg-card p-6"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{description}</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span aria-hidden>·</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 写截图区（占位兜底）**

`site/src/components/screenshot-section.tsx`：

```tsx
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

// 单张截图：图片缺失时（onError）显示虚线占位框，放入真实截图后自动替换
function ScreenshotFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  const [missing, setMissing] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        {missing ? (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden />
            <span className="text-sm">截图待补充：{caption}</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="aspect-[16/10] w-full object-cover object-top"
            onError={() => setMissing(true)}
          />
        )}
      </div>
      <figcaption className="text-center text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

// 截图区：工作台 / 聊天页 / 记录页三张界面图
export function ScreenshotSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        界面一览
      </h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <ScreenshotFigure
          src="screenshots/workbench.png"
          alt="侧边栏工作台"
          caption="工作台"
        />
        <ScreenshotFigure
          src="screenshots/chat.png"
          alt="聊天页与 HR 档案"
          caption="聊天页"
        />
        <ScreenshotFigure
          src="screenshots/records.png"
          alt="职位记录页"
          caption="记录页"
        />
      </div>
    </section>
  );
}
```

注意：`src` 不以 `/` 开头（`'screenshots/workbench.png'`），相对解析自动带上 Vite `base` 的 `/hi-job/` 前缀，本地 dev 与 Pages 部署路径都正确。

- [ ] **Step 3: 组装进 App**

`site/src/app.tsx` 的 import 与 JSX 中、`HeroSection` 之后追加：

```tsx
import { FeatureSection } from './components/feature-section';
import { ScreenshotSection } from './components/screenshot-section';
```

```tsx
<FeatureSection />
<ScreenshotSection />
```

- [ ] **Step 4: 验证并提交**

```bash
pnpm run fix
pnpm --dir site typecheck && pnpm --dir site build
pnpm --dir site run dev # 检查：四卡片渲染、三截图位均显示占位框
git add site
git commit -m "feat: 落地页功能特性区与截图区"
```

---

### Task 4: 安装教程、FAQ 与页脚

**Files:**
- Create: `site/src/components/install-section.tsx`、`site/src/components/faq-section.tsx`、`site/src/components/site-footer.tsx`
- Modify: `site/src/app.tsx`

**Interfaces:**
- Consumes: `cn()`、`DownloadButton`（Task 2 的 `size: 'md'`）、`REPO_URL`、`ISSUES_URL`
- Produces: `InstallSection`、`FaqSection`、`SiteFooter` 组件；页面自此完整

- [ ] **Step 1: 写安装教程区**

`site/src/components/install-section.tsx`：

```tsx
import { DownloadButton } from './download-button';

// 安装五步：zip 侧载流程，面向无开发背景用户
const STEPS: readonly string[] = [
  '点击下载按钮，得到 hi-job-chrome.zip，解压到一个不会删除的目录（例如「文档」下新建 hi-job 文件夹）',
  '打开 Chrome，地址栏输入 chrome://extensions/ 回车',
  '打开页面右上角的「开发者模式」开关',
  '点击「加载已解压的扩展程序」，选择解压出来的文件夹（选内含 manifest.json 的那一层）',
  '工具栏出现扩展图标，点开侧边栏即可使用',
];

// 安装教程区：步骤列表 + 更新说明
export function InstallSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        安装与更新
      </h2>
      <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6 sm:p-8">
        <ol className="mb-8 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex justify-center">
          <DownloadButton />
        </div>
        <p className="mt-6 rounded-lg bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
          更新方式：有新版本时重新下载 zip、解压到新目录，再到
          chrome://extensions/ 重新加载。扩展 ID 已固定，职位记录、HR
          档案等数据不会丢失；旧目录确认新版可用后可删除。解压后的目录别删别挪，扩展需要持续读取它。
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 写 FAQ 区**

`site/src/components/faq-section.tsx`：

```tsx
// FAQ 条目：用户最关心的四个问题
const FAQS: readonly { question: string; answer: string }[] = [
  {
    question: '更新会丢数据吗？',
    answer:
      '不会。扩展 ID 已固定，重新加载新版后职位记录、HR 档案、屏蔽名单等数据自动延续。',
  },
  {
    question: '我的数据安全吗？',
    answer:
      '所有数据仅保存在你浏览器本地（IndexedDB），不上传任何服务器；AI 厂商的 API Key 也只存本地。',
  },
  {
    question: '支持哪些浏览器？',
    answer: 'Chrome、Edge 等 Chromium 内核浏览器；Firefox 版暂不提供。',
  },
  {
    question: '是免费的吗？',
    answer:
      '是，开源项目永久免费。AI 生成功能使用你自己配置的厂商 Key，费用由相应厂商收取。',
  },
];

// FAQ 区：问答列表
export function FaqSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        常见问题
      </h2>
      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-xl border bg-card p-5"
          >
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
              {question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 写页脚**

`site/src/components/site-footer.tsx`：

```tsx
import { ISSUES_URL, REPO_URL } from '../lib/site';

// 页脚：仓库入口、反馈、合规声明
export function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 border-t py-8 text-center text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub 仓库
        </a>
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          问题反馈
        </a>
      </div>
      <p>本扩展与 BOSS直聘无任何关联，仅供个人学习与技术交流使用。</p>
      <p>数据全部本地存储，绝不上传。</p>
    </footer>
  );
}
```

- [ ] **Step 4: 组装并完成页面**

`site/src/app.tsx` 整体替换为：

```tsx
import { FaqSection } from './components/faq-section';
import { FeatureSection } from './components/feature-section';
import { HeroSection } from './components/hero-section';
import { InstallSection } from './components/install-section';
import { ScreenshotSection } from './components/screenshot-section';
import { SiteFooter } from './components/site-footer';
import { SiteHeader } from './components/site-header';

// 落地页组装：自上而下排列各区块
export function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      <SiteHeader />
      <HeroSection />
      <FeatureSection />
      <ScreenshotSection />
      <InstallSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 5: 验证并提交**

```bash
pnpm run fix
pnpm --dir site typecheck && pnpm --dir site build
pnpm --dir site run dev
# 浏览器逐区检查：五个步骤编号正确、FAQ 折叠/展开可用、页脚链接指向仓库与 issues；
# 缩窄窗口到手机宽度确认响应式（卡片单列、按钮换行）
git add site
git commit -m "feat: 落地页安装教程、FAQ 与页脚"
```

---

### Task 5: 扩展发版 workflow（release.yml）

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: 根 `package.json` 的 `version` 字段与 `zip` 脚本（已存在）
- Produces: 打 `v*` tag 时的自动发版；Release 附件固定名 `hi-job-chrome.zip`（落地页 `DOWNLOAD_URL` 依赖此名）

- [ ] **Step 1: 写 workflow 文件**

`.github/workflows/release.yml`：

```yaml
# 扩展发版流水线：打 v* tag 时构建 zip 并发布 GitHub Release
name: release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      # 仓库不入库 lockfile，关闭 frozen 校验
      - name: Install dependencies
        run: pnpm install --no-frozen-lockfile

      # 防“发错版”：tag 与 package.json 版本必须一致
      - name: Verify tag matches package version
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          PKG_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG" != "$PKG_VERSION" ]; then
            echo "::error::tag v$TAG 与 package.json version $PKG_VERSION 不一致"
            exit 1
          fi

      - name: Build and zip extension
        run: pnpm zip

      # WXT 默认产物名带版本号，重命名为固定名以支撑 releases/latest 固定直链
      - name: Rename artifact
        run: mv .output/*.zip hi-job-chrome.zip

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: hi-job-chrome.zip
          generate_release_notes: true
```

- [ ] **Step 2: 验证并提交**

```bash
# YAML 语法本地快查：python -c "import yaml,sys;yaml.safe_load(open('.github/workflows/release.yml'))" 2>/dev/null || true
# 逐行自查触发条件/权限/步骤名后提交；真正端到端验证在 Task 7 之后的 v0.1.0 tag
git add .github/workflows/release.yml
git commit -m "ci: 新增打 tag 自动构建发 Release 流水线"
```

---

### Task 6: 落地页部署 workflow（deploy-site.yml）

**Files:**
- Create: `.github/workflows/deploy-site.yml`

**Interfaces:**
- Consumes: `site/` 的 `build` 脚本（Task 1）
- Produces: `site/**` 或本 workflow 变更时自动部署 `https://518luck.github.io/hi-job/`；需要仓库 Settings → Pages → Source 选 "GitHub Actions"（一次性人工设置，见 Task 7）

- [ ] **Step 1: 写 workflow 文件**

`.github/workflows/deploy-site.yml`：

```yaml
# 落地页部署流水线：site/ 变更时构建 site/ 并发布 GitHub Pages
name: deploy-site

on:
  push:
    branches: [main]
    paths: ['site/**', '.github/workflows/deploy-site.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Pages 同一时间只保留一个部署，新部署取消旧部署
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      # 仓库不入库 lockfile，关闭 frozen 校验
      - name: Install site dependencies
        run: pnpm install --no-frozen-lockfile --dir site

      - name: Build site
        run: pnpm --dir site run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/dist

      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 验证并提交**

```bash
# 同 Task 5：YAML 自查后提交，端到端验证依赖 Pages Source 设置 + 推送 main
git add .github/workflows/deploy-site.yml
git commit -m "ci: 新增落地页 GitHub Pages 自动部署流水线"
```

---

### Task 7: README 下载入口同步与全局收尾

**Files:**
- Modify: `README.md`（「安装」一节开头）
- Create: 无

**Interfaces:**
- Consumes: 落地页地址 `https://518luck.github.io/hi-job/`、固定下载直链
- Produces: 文档与下载站一致；本任务后进入上线步骤（Pages 设置 + 打 tag）

- [ ] **Step 1: README 安装节增加下载入口**

在 `README.md` 的「## 安装」标题与其下现有 `> ⚠️` 警告块之间插入：

```markdown
### 方式一：下载安装（推荐普通用户）

访问 **[下载页](https://518luck.github.io/hi-job/)**，下载最新版 zip 解压后，按页面教程在 `chrome://extensions/` 加载即可。

### 方式二：本地构建（开发者）

```

同时把原警告块首句「开发阶段使用…」改为「本地构建使用…」（原句与新入口并列后不再全局成立）。

- [ ] **Step 2: 全局收尾验证**

```bash
pnpm run fix
pnpm run typecheck   # 扩展侧不受影响
pnpm --dir site typecheck && pnpm --dir site build
pnpm --dir site run preview # 确认 dist 产物资源路径带 /hi-job/ 前缀
git add README.md
git commit -m "docs: README 安装节新增下载页入口"
```

- [ ] **Step 3: 上线步骤（人工操作，非代码）**

1. 推送 main 后：GitHub 仓库 **Settings → Pages → Build and deployment → Source 选 "GitHub Actions"**；随后 Actions 里手动触发一次 `deploy-site`（workflow_dispatch）验证部署，访问 `https://518luck.github.io/hi-job/`
2. `package.json` 已是 `0.1.0`：`git tag v0.1.0 && git push origin v0.1.0`，验证 release workflow 产出 `hi-job-chrome.zip`，且落地页下载按钮、版本号正常
3. 后续提供三张截图放入 `site/public/screenshots/`（`workbench.png`、`chat.png`、`records.png`，16:10 比例最佳），推 main 即自动更新

---

## 计划自检记录

- **Spec 覆盖**：架构（site/ 独立站→Task 1）、页面七节结构（Task 2/3/4 逐一对应）、release 流水线（Task 5）、deploy 流水线（Task 6）、上线步骤（Task 7 Step 3）、验证方式（各任务验证步骤 + 全局约束声明）——无遗漏；README 同步为 spec「行为变更同步文档」要求的落地点
- **占位符扫描**：所有代码步骤给全文，无 TBD/「稍后实现」
- **类型一致性**：`useLatestVersion` 返回 `{ version: string; failed: boolean }` 与 HeroSection 解构一致；`DownloadButton({ size })` 定义与 Task 4 复用一致；常量名 `DOWNLOAD_URL/API_LATEST_RELEASE/REPO_URL/ISSUES_URL/SITE_TITLE` 在 Task 1 定义、Task 2/4 引用一致；产物名 `hi-job-chrome.zip` 在 Task 5 与 Task 1 常量一致
