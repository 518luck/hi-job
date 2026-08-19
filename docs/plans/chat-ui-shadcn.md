# Plan: 聊天窗 UI 全面切换到 shadcn 组件（chat-ui-shadcn）

## Context

聊天 UI（隔离世界 shadow root 内的 React 聊天窗）当前用手写 Tailwind 类实现按钮/窗口壳/气泡/图标。项目已有 shadcn/ui（base-lyra 风格、`shared/ui/`、`@base-ui/react` 底座、`app.css` 主题 token）。目标：把聊天窗的按钮、图标、窗口壳、悬停气泡全部换成 shadcn 组件，让观感与侧边栏体系一致，并减少手写样式代码。玻璃悬浮按钮（`.hijob-fab`）不属于 shadcn 范畴，保持自定义。

## Global Constraints

- 所有 shadcn 组件安装必须用 `npx shadcn@latest add <component>`；禁止 `pnpm dlx`、禁止使用本地 pnpm store 里的旧版 shadcn。
- 检查一律走项目脚本：`pnpm run typecheck`、`pnpm run fix`（biome check --write）。禁止 `@ts-ignore`、`@ts-expect-error`、`biome-ignore`。
- 注释规范：新增/重写函数与组件上方加一行中文单行注释；React 组件用 `function` 声明；hook/工具函数用 `const` 箭头函数；类型专用导入用 `import type`；参数对象用 Options Object。
- 视觉约束：聊天窗保持固定深色（不随系统/侧边栏明暗切换）、直角风格、340×420 尺寸、px 定尺寸；不与宿主页明暗联动。
- shadow root 内 rem 基准不可依赖宿主 `<html>` 字号：所有 Tailwind 尺寸/字号/圆角相关 token 在领域 CSS 中钉定为 px。
- shadcn 组件依赖的主题 CSS 变量（`--primary`、`--border`、`--ring`、`--muted` 等）在宿主页面不存在，必须在 `.hijob-chat-root` 作用域内自行定义（固定深色值），不得依赖 `app.css` 的 `:root`。
- Base UI 浮层默认 portal 到 `document.body`，会逃出 shadow root：气泡必须通过 `container` 指向 `.hijob-chat-root`，留在 shadow root 内。
- 协议面（`shared/infra/messaging`、`shared/infra/ai`）、流式链路（`use-ai-stream`、`smooth-stream-text` 用法）、主世界脚本一律不动；只改聊天 UI 呈现层与领域 CSS。
- 每个任务完成后运行 `pnpm run typecheck` 且通过；任务 3 额外要求 `pnpm run lint` 与 `pnpm run build` 全绿。
- 保持玻璃按钮、拖拽、流式打字机、复制、去授权、自动滚底的既有行为不变。

## Task 1: 领域 CSS 基座——shadcn 主题 token 与 px 钉定

文件：`pages/world/isolated-world/chat-ui/ui/chat-ui.css`（追加内容，不删除现有玻璃/转圈样式）。

1. 在 `.hijob-chat-root` 规则内追加固定深色主题 token，覆盖 shadcn 组件实际用到的变量，最小集合必须包含且不止于（值取聊天窗现有深色：
   - `--background: #18181b`；`--foreground: #fafafa`
   - `--primary: #fafafa`；`--primary-foreground: #18181b`
   - `--secondary: #27272a`；`--secondary-foreground: #fafafa`
   - `--muted: #27272a`；`--muted-foreground: #a1a1aa`
   - `--border: #3f3f46`；`--input: #3f3f46`
   - `--ring: #a1a1aa`；`--destructive: #dc2626`；`--accent: #27272a`；`--accent-foreground: #fafafa`
   - `--radius: 0`（保持直角）
   对照 `shared/ui/button.tsx`、`shared/ui/card.tsx`、`shared/ui/tooltip.tsx`（Task 2 生成后回补）实际引用的变量补齐。
2. 在文件内追加 `@theme` 块把 rem 基座钉成 px（Tailwind v4 机制）：
   - `--spacing: 4px`（间距/尺寸工具类全部转为 px 倍数）
   - `--text-xs: 12px`、`--text-xs--line-height: 16px`；`--text-sm: 13px`、`--text-sm--line-height: 18px`；`--text-base: 14px`、`--text-base--line-height: 20px`
   - `--radius: 0px`（若 `@theme` 需要，`--radius-sm/md/lg/…` 一并 0）
   - 若引用的组件类还用到其他 `--text-*`/`--spacing` 派生 token，按需补充，保证生成结果不含 rem。
3. 验证：`pnpm run typecheck` 通过；`pnpm run build` 成功且 `content-scripts/chat-ui.css` 含新 token（手动抽查即可，不用断言进测试）。

交付判断：`.hijob-chat-root` 内 token 齐全、无 rem 依赖、构建产物含对应变量。

## Task 2: 安装 shadcn tooltip 并适配 shadow root container

1. 运行 `npx shadcn@latest add tooltip`，生成 `shared/ui/tooltip.tsx`（base-lyra 风格，底座为 `@base-ui/react/tooltip`）。
2. 修改 `shared/ui/tooltip.tsx`（CLI 生成源码允许自由修改）：给 Provider 组件增加可选 `container?: HTMLElement | null` 属性（默认 `null` = Base UI 默认行为 portal 到 body），透传到 `TooltipPortal` 的 `container`（已验证 Base UI `TooltipPortal`/`FloatingPortalLite` 支持 `container` 透传）。保持其余 API 与现有导出不变（侧边栏现有用法不回归）。
3. 验证：`pnpm run typecheck` 通过；`shared/ui` 内其他组件引用方式不受影响。

交付判断：tooltip.tsx 有 container 透传且旧用法兼容。

## Task 3: chat-window.tsx 全面替换为 shadcn 组件

文件：`pages/world/isolated-world/chat-ui/ui/chat-window.tsx`（主改），必要时 `chat-app.tsx`/`mount.tsx` 只做最小配合（如把 shadow 根元素引用传递给 Tooltip container）。

替换映射（保持视觉等价）：
- 场景按钮/复制按钮：`shared/ui/button.tsx` 的 `Button`。映射：回复按钮 → `variant="default"`；问候/提醒/反馈/复制 → `variant="outline"`；尺寸用 `size="sm"` 附近，最终以「深色、直角、五按钮不换行、可容纳 340px 窗宽」为验收。生成中禁用态沿用 `disabled`。
- 关闭按钮：`Button` `variant="ghost"` + `size="icon-sm"` 或等价，图标用 lucide `X`。
- 复制按钮内容：lucide `Copy` / `Check`（成功后 1.2s 恢复）。
- 转圈（正文空流/按钮 busy）：lucide `Loader2` + Tailwind `animate-spin`，替换自定义 `.hijob-loading-spinner`/`.hijob-button-spinner` 用法（自定义类可保留定义或删除，二选一，但 UI 不再引用）。
- 悬停气泡：`shared/ui/tooltip.tsx` 的 Tooltip，`container` 传 `.hijob-chat-root`（shadow 根），保持 300ms 延迟展示、点击隐藏、水平居中夹在窗宽内的行为。
- 窗口壳：`shared/ui/card.tsx` 的 `Card`/`CardHeader`/`CardContent`/`CardFooter` 重构标题栏/正文/操作区结构；`style` 定位与 340×420 尺寸保持不变（由 props style 传入）。
- 删除手写件：`HoverTip`/`TipButton`、`SCENE_BUTTONS` 中 tip 文案迁到 Tooltip 的 content；`OUTLINED_BUTTON_CLASS`/`PRIMARY_BUTTON_CLASS`、`usePrefersReducedMotion` 保留（仍用于打字机降级）。
- 玻璃按钮（`chat-fab.tsx`）、GlassFilter、useAiStream、smooth-stream-text 的 `useSmoothStream` 用法、自动滚底、去授权按钮逻辑：全部保持原样（去授权按钮的样式改走 Button variant="default"）。

验证：`pnpm run typecheck`、`pnpm run lint`、`pnpm run build` 全绿；构建产物 `content-scripts/chat-ui.js` 含 lucide 图标与 tooltip 组件（抽查）；确认无残留对已删自定义类的引用（`grep hijob-loading-spinner hijob-button-spinner` 应只剩 CSS 定义或无引用）。

交付判断：呈现层全部组件化、无手写按钮类、三检查全绿。

## Task 4: 最终全量验证与收尾

1. `pnpm run fix` 全量格式化/lint 后 `pnpm run lint`、`pnpm run typecheck`、`pnpm run build` 全绿。
2. 全仓 grep 确认：无对已删除自定义类/组件的引用残留；`chat-ui.css` 无未使用 token（可留，不强制删）。
3. 确认 `package.json` 依赖无意外新增（lucide-react 已存在；smooth-stream-text 已在前面任务引入，不动）。
