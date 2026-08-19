# chat-ui 重构：assistant-ui runtime + shadcn elements 四件套

## 背景与目标

`pages/world/isolated-world/chat-ui` 是注入 BOSS 直聘聊天页的悬浮聊天窗（Shadow Root 内 React，无 composer，场景按钮触发单次流式生成）。现有点位为手写实现：加载态（`hijob-typing-dots` 三点 CSS）、推理面板（`reasoning-row.tsx`）、流式文本（`smooth-stream-text` 打字机）、消息对（右对齐用户气泡 + AI 正文）。

本次重构用以下方案替换（已与需求方逐项确认）：

| 决策点 | 结论 |
|---|---|
| 深度 | 完整接入 `@assistant-ui/react` runtime（`useExternalStoreRuntime`） |
| 四个 UI 件 | shadcn 注册表 `@assistant-ui/elements-*`（纯展示组件，props 驱动，不依赖 runtime） |
| runtime 数据源 | 现有 `useAiStream` 原样保留（requestId 关联、双段空闲超时、cancelAiStream） |
| 流式手感 | 词到达即现（`visibleWords` = 已到达词数），删除 `smooth-stream-text` 依赖 |
| hover 操作 | MessagePair 自带复制/重新生成按钮接真实行为：复制=现有 handleCopy 逻辑，重新生成=重跑当前场景 |
| 保留不动 | 窗壳 340×420 深色、场景按钮+tooltip、底栏复制按钮、错误+授权分支、空态占位、关窗取消 |

## 现状关键文件

- `pages/world/isolated-world/chat-ui/model/use-ai-stream.ts` — 流式状态机（idle/streaming/done/error），消费后台 `hiJobStream` 推送，首包 30s / 间隔 15s 空闲超时，`cancel()` 终止。**逻辑不动。**
- `pages/world/isolated-world/chat-ui/model/chat-context.ts` — `requestChatContext()` 经 Window RPC 读主世界会话数据，返回 null 或 `{ jobId, jd, hr, messages }`。
- `pages/world/isolated-world/chat-ui/ui/chat-app.tsx` — 编排：fab 定位、窗口开关、`handleScene`（RPC 校验 → `start(method, data)`）、sceneLabel/sceneError/busyMethod 状态。
- `pages/world/isolated-world/chat-ui/ui/chat-window.tsx` — 窗壳 + 正文区（错误/空态/消息流三分支）+ 底栏。
- `pages/world/isolated-world/chat-ui/ui/reasoning-row.tsx` — 手写思考折叠行（本次删除）。
- `pages/world/isolated-world/chat-ui/ui/chat-ui.css` — Tailwind `source(none)` + 显式 `@source`，`.hijob-chat-root` 固定深色 token，禁 rem 字号。
- 场景方法：`greeting`（入参不带 messages）/ `followUp` / `rejectionFeedback` / `generateReply`（带 messages），中文名：问候/提醒/反馈/回复。

## Global Constraints（约束所有任务）

1. 验证命令：类型检查 `pnpm run typecheck`；lint+格式 `pnpm run fix`。禁止 `@ts-ignore`、`@ts-expect-error`、`biome-ignore`。本项目无单测框架，任务的「测试」= typecheck + fix + （涉及产物时）`pnpm run build` 成功。
2. 聊天窗在 Shadow Root 内：**字号类必须 px**（`text-[13px]` 风格，跟随现有代码）；spacing/gap/size 等布局类允许 Tailwind 默认步进（与现有 chat-window.tsx 一致）。不引用 app.css。
3. 新组件只放 `pages/world/isolated-world/chat-ui/ui/` 下（elements 子目录），不进 `shared/ui`，不进 chat-ui 的聚合出口 `index.ts`（chat-ui 本身不进聚合出口）。
4. `chat-ui.css` 的 `@source "./"` 覆盖 chat-ui 全目录，新增文件自动被扫描；新依赖 CSS（tw-shimmer、tw-animate-css）必须且只能在 chat-ui.css 引入。
5. shadcn CLI 一律 `npx shadcn@latest add ...`，禁止 `pnpm dlx`。
6. 代码规范（AGENTS.md）：新增/重写函数、组件加简短中文单行注释；React 组件 `function` 声明；非组件函数/自定义 Hook 用 `const` 箭头；文件名 kebab-case；参数 ≥2 或含可选参数用 Options object 解构；`import type` 用于纯类型导入；避免 `any`/非空断言 `!`/类型断言 `as`（`as const` 惯用除外）；JSX 注释用 `{/* // ... */}` 形式。
7. 行为保留：useAiStream 双段空闲超时与取消逻辑不动；hiJobStream 协议与四场景方法入参不动；关窗取消在途生成；followUp 的「末条须为自己发」前置校验保留。
8. 中文分词：elements 按空格切词对中文失效，需把中文按 2 字符粒度切分（标点并入前词），ASCII 词按空白切分。
9. 聊天窗视觉基调：深色 token（`--background: #18181b`、气泡 `#27272a`、正文 13px、圆角小/直角），elements 默认亮色类（`paper` 等）在 `.hijob-chat-root` 固定 token 下自然呈深色，不额外加亮色样式。

## Task 1: 依赖安装与 elements 落位

1. `pnpm add @assistant-ui/react tw-shimmer`，`pnpm remove smooth-stream-text`。
2. `components.json` 增加注册表：优先 style-aware URL `"@assistant-ui": "https://r.assistant-ui.com/styles/base-lyra/{name}.json"`；用 `curl -sI` 验证 elements 在该路径可达（404 则退回 `"https://r.assistant-ui.com/{name}.json"`，即本任务验证过的平铺路径）。
3. `npx shadcn@latest add collapsible` → 落 `shared/ui/collapsible.tsx`（base-lyra/Base UI flavor，提供 `--collapsible-panel-height` 动画变量）。
4. `npx shadcn@latest add "@assistant-ui/elements-message-pair" "@assistant-ui/elements-loading-state" "@assistant-ui/elements-reasoning-panel" "@assistant-ui/elements-streaming-text"`（连带安装 `elements-surfaces`、`elements-range`）。
5. 把 6 个 elements 文件（message-pair.tsx、loading-state.tsx、reasoning-panel.tsx、streaming-text.tsx、surfaces.tsx、range.ts）挪到 `pages/world/isolated-world/chat-ui/ui/elements/`；修正导入：`@/lib/utils`→`@/shared/lib/cn`，`@/components/ui/collapsible`→`@/shared/ui/collapsible`；清理 CLI 落盘的空目录与无关产物。
6. `chat-ui.css`：`@import "tailwindcss" source(none);` 之后加 `@import "tw-animate-css";`；按 tw-shimmer 包文档加入其 Tailwind v4 插件引入（`@plugin "tw-shimmer";`，以其 README 为准）。
7. 本任务**不改** elements 源码内容（中文化/px 化归 Task 2）；`"use client"` 指令若引发 biome/typecheck 问题则删除该行。typecheck + fix 通过后 commit。

## Task 2: elements 中文化与 px 化适配

对 `chat-ui/ui/elements/` 六个文件：

1. 文案中文化：`Thinking`→`思考中`；`aria-label="Copy response"`→`aria-label="复制回复"`；`aria-label="Regenerate response"`→`aria-label="重新生成"`。
2. 字号 px 化（仅字号，spacing 不动）：`text-sm`→`text-[13px]`；`text-[13.5px]`→`text-[13px]`；`text-[11px]`、`text-[0.85em]` 保留；`min-h-[8.5rem]`/`min-h-[4.25rem]` 这类 rem 占位高直接删除（聊天窗消息流不需要最小占位高度）。
3. 视觉对齐现有窗：MessagePair 用户气泡 `rounded-2xl px-3.5 py-2` 调整为与现有一致的 `rounded-lg px-2.5 py-1.5`。
4. 规范化：`range.ts` 具名 `function` 转 `const` 箭头并加中文注释；`surfaces.tsx` 导出常量与组件加简短中文注释；六个文件按规范补文件头 `#` 标题注释；组件导出保持 `function` 声明。
5. typecheck + fix 通过后 commit。

## Task 3: runtime 组装（model 层）

新增 `pages/world/isolated-world/chat-ui/model/chat-runtime.ts`（及需要的 driver）：

1. `useChatRuntime()`（const 箭头 hook）：
   - 内部持有 `useAiStream()` 与场景状态（sceneLabel、sceneError、busyMethod，从 chat-app.tsx 迁入），保留原 `handleScene` 的全部前置校验（会话缺失/无聊天记录/followUp 末条校验）。
   - `useExternalStoreRuntime` 组装：`messages`（空态 `[]`；否则 [user 场景句, assistant 消息]）、`isRunning`（status==='streaming'）、`onCancel`（=cancel）、`onNew`（消费 `pendingMethodRef` 中的场景方法执行生成；无 pending 时忽略）。
   - assistant 消息 content：优先标准 `{ type: 'reasoning', text }` part + `{ type: 'text', text }` part；若 `@assistant-ui/react` 版本的 external store 类型不接受 reasoning part（typecheck 失败），降级为仅 text part、reasoning 经 hook 直读喂面板，并在报告中说明采用了哪条路径。
   - 对外返回：runtime、`startScene(method)`（记录 pendingMethodRef 后经 runtime 通道追加用户消息触发）、以及视图需要的派生状态（sceneError、busyMethod、bodyStatus 等）。
2. driver（同文件或 `model/stream-driver.ts`）：
   - `useWordSegments(text)`：中文按 2 字符切分（标点并入前词）、ASCII 按空白切分，返回 `Segment[]`（`{ text, mono? }`，mono 恒 false 可省）。
   - `useStreamTick({ active, intervalMs = 150 })`：active 时 setInterval 递增计数，返回 tick；同时派生 elapsed 秒数（供 ReasoningPanel 计时展示）。
3. 纯 model 层改动，不动 UI；typecheck + fix 通过后 commit。

## Task 4: 视图重写与清理

1. `chat-app.tsx`：改用 `useChatRuntime()`，`AssistantRuntimeProvider` 包住 `ChatWindow`；sceneLabel/sceneError/busyMethod/handleScene 编排迁入 model 层后本文件简化（fab 定位、窗口开关保留）。
2. `chat-window.tsx` 正文区重写（窗壳、底栏、错误分支、空态不动）：
   - 等待首 token（streaming 且 reasoning==='' 且 text===''）：`GenerationLoader`，label「正在生成」，tick 来自 `useStreamTick`。
   - 思考行：`ReasoningPanel`，steps=reasoning 非空行（title=行文本、body 不渲染空段落可微调组件），visibleSteps=行数，streaming=text===''，open 受控默认 false，restingLabel「已思考」，elapsed 来自 driver。
   - 消息对：`MessagePair`，userMessage=场景句（`为你生成「场景」`），words/segments 来自 `useWordSegments(text)`，visibleWords=全部（词到达即现），streaming=isRunning；hover 复制接现有 handleCopy（保留 copying/done 状态与底栏复制按钮），重新生成接「重跑当前场景」。
   - 删除 `useSmoothStream`、`usePrefersReducedMotion` 打字机逻辑、`ReasoningRow` 导入；自动滚底 useEffect 保留（依赖改为 segments 长度/reasoning）。
3. 删除 `ui/reasoning-row.tsx`；`chat-ui.css` 删除 `hijob-typing-dots`、`hijob-reasoning-sweep`、`hijob-reasoning-summary` 及相关 keyframes。
4. 验证：`pnpm run typecheck`、`pnpm run fix`、`pnpm run build` 成功；报告内容脚本产物尺寸对比（重构前先记录基线）。commit。
