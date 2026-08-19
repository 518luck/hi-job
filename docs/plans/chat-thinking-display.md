# Plan: 聊天窗 AI 思考文本流式展示

## Context

把 BOSS 直聘聊天窗（隔离世界 shadow root 内的 React UI）的正文区从「单块流式文本」升级为「类聊天消息流」，并支持展示 AI 的思考（reasoning）文本。

用户交互流程：点击「问候 / 提醒 / 反馈 / 回复」任一场景按钮后，正文区按聊天形式展示——先出现一条用户侧消息（精简概要），然后 AI 回复：**有思考时先流式返回思考，再返回正文；没有思考时直接返回正文**。

参考项目 `/Users/duoyun/work/open-source/deepseek-harness`（DeepSeek 官方 agent harness）的结论：
- 思考来自流式 chunk 的 `reasoning_content`；我们装的 `@ai-sdk/openai-compatible@3.0.30` 已在**流式路径**把它映射为 `reasoning-delta`（`ai@7` 的 `streamText().fullStream` 可取，字段为 `part.text`），正文是 `text-delta`（同样 `part.text`）。
- 数据模型上把思考做成消息内按序的 block；UI 用**可折叠单行思考行**（弱化灰色、展开 pre-wrap、流式时显示最后一行），无思考时零渲染。
- deepseek-harness 的聊天/思考 UI 是**全手写**的，没有合适的维护中成品库；本计划同样手写聊天/思考 UI，复用已有维护库（smooth-stream-text 打字机、lucide 图标、shadcn Button/Card）。

## 已确认的设计决策（用户未逐条作答，按推荐项执行）

1. **思考展示形态**：可折叠思考行（对齐 deepseek-harness）——默认收起一行「思考 · 最后一行」，流式中带扫光动画，点击展开看全文（灰色弱化、`whitespace-pre-wrap`）。
2. **用户侧消息**：精简概要——只显示一条「为你生成「{场景名}」…」，不贴完整 prompt（完整 prompt 含 system+JD+简历+聊天记录，太长）。
3. **正文渲染**：保持纯文本 + 现有 smooth-stream-text 打字机，不引入 markdown。
4. **无思考时**：零渲染思考行。

## Global Constraints

- 运行环境：Chrome MV3 扩展，聊天 UI 在隔离世界 shadow root 内（React 19 + Tailwind v4 + biome）。
- AI：`ai@7` `streamText`；思考取自 `fullStream` 的 `reasoning-delta`（`part.text`），正文取自 `text-delta`（`part.text`）。
- 协议链：`shared/zod/ai-stream.ts`（事件 discriminated union）→ `shared/infra/ai/ai-stream.ts`（编排/攒批/推送）→ `browser.tabs.sendMessage` 的 `hiJobStream` 信封 → 前端 `use-ai-stream` 按 `requestId` 消费。
- 项目规范（AGENTS.md）：中文单行注释；`import type`；React 组件用 `function` 声明；多参函数用 Options Object；禁 `any`/类型断言/`@ts-ignore`/`biome-ignore`；新文件 kebab-case；`@/shared/zod` 聚合导入。
- 每个任务完成跑 `pnpm run typecheck`（任务标注 build/lint 的按其要求）。
- 不引入不维护的库；聊天/思考 UI 手写（无合适成品库），复用既有维护库。
- 视觉：聊天窗固定深色（`#18181b` 系）、直角、340×420；思考区用更弱的灰色层级，明显弱于正文。
- 保持既有行为：流式攒批、空闲超时、取消、复制、去授权、玻璃按钮、自动滚底（滚底需适配新的消息流结构）。

## Task 1: 协议扩展 + 后端 reasoning 提取

文件：`shared/zod/ai-stream.ts`、`shared/infra/ai/vendor-client.ts`、`shared/infra/ai/ai-stream.ts`。不改 `background.ts`（`stream` 对象由编排层注入 `onReasoning`，经 handler→scene→`chatWithVendor` 透传，类型结构化兼容）。

1. **`shared/zod/ai-stream.ts`**：在 `aiStreamEventSchema` 的 `z.discriminatedUnion('kind', [...])` 新增成员：
   ```ts
   z.object({
     requestId: z.string().min(1), // 关联的流式请求 id
     kind: z.literal('reasoning'), // 思考增量事件
     delta: z.string(), // 本次追加的思考文本增量
   }),
   ```
2. **`vendor-client.ts`**：
   - `AiStreamCallbacks` 增加可选 `onReasoning?: (delta: string) => void`。
   - 流式分支从遍历 `streamResult.textStream` 改为遍历 `streamResult.fullStream`：
     - `part.type === 'reasoning-delta'` 且 `part.text !== ''` → `stream.onReasoning?.(part.text)`；
     - `part.type === 'text-delta'` 且 `part.text !== ''` → `stream.onChunk(part.text)`。
   - 其后 `result = (await streamResult.text).trim()`、`usage = await streamResult.usage` 保持不变；非流式 `generateText` 分支不动。
3. **`ai-stream.ts`（infra）**：
   - `StreamCallbacks` 增加 `onReasoning?: (delta: string) => void`。
   - `executeStream` 为 reasoning 与 text **各维护独立缓冲与 flush 定时器**（复用 `CHUNK_FLUSH_MS`）：reasoning 缓冲推 `{kind:'reasoning', delta}`，text 缓冲推 `{kind:'chunk', delta}`（现状）。任务成功结束：先 flush 两个缓冲残余，再推 `end`；异常：清缓冲推 `error`。
4. 验证：`pnpm run typecheck`、`pnpm run build`。

## Task 2: 前端 use-ai-stream 累积 reasoning

文件：`pages/world/isolated-world/chat-ui/model/use-ai-stream.ts`。

1. 新增 `const [reasoning, setReasoning] = useState('')`。
2. 推送监听里新增分支：`event.kind === 'reasoning'` → `setReasoning((prev) => prev + event.delta)` + `armIdleTimer(CHUNK_GAP_TIMEOUT_MS)` + `return`。现有 `chunk`/`end`/`error` 分支不动。
3. `start` 与 `cancel` 里在 `setText('')` 处同时 `setReasoning('')`（`teardown` 不清，`end` 需保留已累积的思考）。
4. `UseAiStreamResult` 增加 `reasoning: string`（中文注释「已累积的思考文本」）并在 return 暴露。
5. 验证：`pnpm run typecheck`。

## Task 3: 思考行组件 ReasoningRow

文件：新建 `pages/world/isolated-world/chat-ui/ui/reasoning-row.tsx`；`pages/world/isolated-world/chat-ui/ui/chat-ui.css` 追加扫光动画。

组件 `ReasoningRow`（function 声明，Options Object props）：
- props：`reasoning: string`（思考全文）、`running: boolean`（该轮思考是否仍在流式中）。
- 折叠态（默认，`useState(false)`）：单行，结构为「chevron 图标 + 「思考」标题 + 摘要」。摘要规则：`running` 为真显示 `reasoning` 的**最后一行非空文本**，`running` 为假显示**第一行非空文本**并以省略号截断；整行可点击切换展开，带 `aria-expanded`。
- `running` 为真时该行叠加扫光动画（CSS 渐变光带从左到右循环），并对 `prefers-reduced-motion` 关闭。
- 展开态：完整 `reasoning` 以 `whitespace-pre-wrap break-words` 渲染，弱化的灰色（明显弱于正文），左缩进。
- 图标用 lucide（如 `BrainCircuit` 或 `ChevronDown/ChevronRight` 指示展开态）。
- 思考为空字符串时组件返回 `null`（无思考零渲染）。

CSS（chat-ui.css）：新增 `.hijob-reasoning-sweep` 扫光 `@keyframes`（参考 deepseek-harness 的 2.6s ease-out 无限循环）与 `@media (prefers-reduced-motion: reduce)` 关闭；思考摘要行的单行截断样式。

验证：`pnpm run typecheck`、`pnpm run lint`。

## Task 4: chat-window 消息流改造 + chat-app 接线

文件：`pages/world/isolated-world/chat-ui/ui/chat-window.tsx`、`pages/world/isolated-world/chat-ui/ui/chat-app.tsx`。

1. **chat-app.tsx**：
   - `useAiStream()` 解构新增 `reasoning`。
   - 新增 `sceneLabel` 状态：在 `handleScene` 里 `setBusyMethod(method)` 处同步设置为该场景的中文名（问候/提醒/反馈/回复，可从 `SCENE_BUTTONS` 按 `method` 查，或在 chat-app 内维护映射）；**不随 done 清空**（消息流需保留本轮场景名），下一次 `handleScene` 覆盖。
   - `<ChatWindow>` 新增传入 `reasoning={reasoning}` 与 `sceneLabel={sceneLabel}`。
2. **chat-window.tsx**：
   - props 新增 `reasoning: string`、`sceneLabel: string`。
   - 正文区 `renderBody` 重构为消息流渲染（替换原单块逻辑），分支：
     - `bodyStatus === 'error'`：保持现有错误视图（错误文案 + 授权按钮）。
     - `bodyStatus === 'idle'` 且 `reasoning === ''` 且 `text === ''`：占位文案「点击下方「生成回复」，获取下一条回复建议」。
     - 其余（streaming 或有内容）：消息流纵向排列——
       a. **用户侧消息**（右对齐气泡）：`sceneLabel` 非空时显示「为你生成「{sceneLabel}」」（streaming 中可用「正在为你生成…」措辞）。
       b. **思考行**：`reasoning !== ''` 时渲染 `<ReasoningRow reasoning={reasoning} running={bodyStatus === 'streaming' && text === ''} />`（思考流式中=streaming 且正文尚未开始；正文开始则思考视为结束）。`reasoning` 为空不渲染。
       c. **正文**：`text` 经现有 `useSmoothStream(text, {done})` 打字机渲染（保持现有 reduceMotion 处理）。
   - 自动滚底逻辑适配消息流（仍滚到 `scrollHeight` 底部；依赖项改为 `shownText`、`reasoning`、`bodyStatus`）。
   - 复制按钮仍复制答案 `text`（错误态复制错误文案），不变。
3. 验证：`pnpm run typecheck`、`pnpm run lint`、`pnpm run build`。

## Task 5: 全量验证与收尾

1. `pnpm run fix`、`pnpm run lint`、`pnpm run typecheck`、`pnpm run build` 全绿。
2. grep 确认无残留：旧的单块正文假设（如仅依赖 `text` 的逻辑）已正确迁移；`hijob-reasoning-sweep` 类与 keyframes 均在产物。
3. 确认 `package.json` 无新增依赖（本计划不新增）。
