# 计划：简历外补充（resume supplement）

工作台新增「简历外补充」卡片：用户录入简历之外的浅层经历（小项目/涉猎），作为素材注入四个聊天场景的 AI 提示词，让沟通更个性化。需求经 grilling 与用户逐条确认。

## Global Constraints（绑定约束，摘自仓库 AGENTS.md 与共识）

- 遵守仓库根 `AGENTS.md` 与 `pages/AGENTS.md`：类型一律 `z.infer` 派生不手写 interface；落库 schema 放 `shared/zod/` 一表一文件、从基座 omit/pick 派生、字段行尾中文注释；`shared/zod/index.ts` 聚合出口，上层从 `@/shared/zod` 导入；新文件 kebab-case；Options Object（参数 ≥2 或含可选参数即对象）；React 组件 function 声明、自定义 Hook const 箭头函数；禁止 biome-ignore / @ts-ignore / as 断言（as const 除外）。
- 本项目无测试框架：验证 = `pnpm run typecheck`（`site/` 目录预置报错与本改动无关，忽略）、`pnpm exec biome check <改动文件>`、`pnpm run build`。
- 共识确定的取值（照抄实现，不得改写）：
  - 字数上限 2000（zod `z.string().max(2000)` + textarea `maxLength={2000}` 双重限制）。
  - prompt 区块标题：`简历外补充（均为浅尝辄止的经历，简历未展示，仅供交流时自然提及）`。
  - 素材使用规则新增一句：`简历外补充均为浅层涉猎：只能作为拉近距离的自然谈资，不得包装成技能优势或写进核心卖点，首条问候不主动罗列。`
  - 注入范围：greeting / reply / follow-up / rejection-feedback 四场景注入；resume-organize 场景**不**注入。
  - 生命周期：独立存储，与 resume 表无关；AI 梳理/恢复/清空简历均不影响补充内容；无简历也可读写。
  - UI：不使用 TanStack Form（用户已确认：单字段失焦自动保存直接用受控 textarea）。

## Task 1：数据层与提示词注入（多文件集成）

1. `shared/zod/resume-supplement.ts`（新建）：`resumeSupplement` 表落库实体 schema `{ key: z.literal('global'), content: z.string().max(2000), updatedAt: z.number() }`（字段行尾中文注释），`resumeSupplementInputSchema` 从基座 `omit({ key: true, updatedAt: true })` 派生，类型 `z.infer` 派生；在 `shared/zod/index.ts` 聚合出口注册（type 与 schema 成对）。
2. `shared/infra/storage/db.ts`：新增 `resumeSupplement` 表（EntityTable，主键 'key'）。注意：现有 `db.version(1).stores({...})` ——按 Dexie 规范新增 `version(2).stores(完整表清单)`（v1 保持原样不动，v2 在 v1 基础上追加新表），不要重建 v1。
3. `shared/infra/storage/resume-supplement/`（新建目录）：`resume-supplement-store.ts` 单行仓储（参照 `ai-preference-store.ts` 模式）：`readResumeSupplement(): Promise<ResumeSupplementRecord | undefined>`（无记录返回 undefined）、`saveResumeSupplement(content: string): Promise<void>`（覆盖写 + updatedAt）。加 `index.ts` 桶文件，并在 `shared/infra/storage/index.ts` 聚合出口注册。
4. `shared/zod/ai-log.ts` 的 `scenePromptSchema` 增加可选字段 `supplementText: z.string().optional()`（行尾中文注释：简历外补充素材）。
5. `shared/infra/ai/scenes/prompt-parts.ts`：`assemblePromptText` 增加 supplement 区块——位于「求职者简历」区块之后，标题用上面共识的区块标题原文，内容为 `supplementText`，空值时整块过滤掉（沿用现有 `.filter(section => section !== '')` 机制）；`MATERIAL_USAGE_RULES` 追加共识的规则句原文。
6. 四个场景文件 `shared/infra/ai/scenes/` 的 `greeting.ts` / `reply.ts` / `follow-up.ts` / `rejection-feedback.ts`：各自在读取 resume 的位置并行读取补充（`supplementStore.readResumeSupplement()`），空串/undefined 不传字段，非空传 `supplementText`；`resume-organize.ts` 不改。
7. 验证：typecheck（site/ 报错忽略）/ biome（改动文件）/ build 全过。

## Task 2：工作台 UI 卡片

1. `pages/workbench/model/use-resume-supplement.ts`（新建，const 箭头 Hook）：`useLiveQuery` 读补充（初值 undefined），暴露 `{ supplement, saveSupplement }`（参照 `use-ai-preference.ts` / `use-resume.ts` 的既有模式；若现有 hook 用别的读取方式则跟随现状）。
2. `pages/workbench/ui/resume-supplement-card.tsx`（新建，function 组件）：
   - 手风琴卡片，**默认收起**，结构照抄 `automation-section.tsx` 的折叠模式：Collapsible 根 + 标题行触发器（旋转箭头用 `group-data-panel-open/trigger:rotate-180`）+ 无边框动画外壳（`overflow-hidden data-open:animate-hijob-collapse-down data-closed:animate-hijob-collapse-up motion-reduce:animate-none`）包裹带边框内容卡（`divide-y divide-border rounded-md border border-border`）。
   - 标题行：左「简历外补充」+ 有内容时的状态小方灯（照抄 `automation-section.tsx` 的 Lamp 形态：`size-1.5 rounded-[2px]`，有内容 `bg-primary`、无内容 `bg-muted-foreground/20`）；右侧箭头。
   - 内容：一行说明文案「不会出现在简历里，仅供 AI 聊天时自然提及」（text-xs text-muted-foreground）+ 受控 textarea（固定高度如 `h-40` + `overflow-y-auto`，**高度不随内容变化**——保证折叠动画测量稳定；`maxLength={2000}`；失焦 `onBlur` 保存）。
   - 底部一行：左侧计数器 `{value.length}/2000`（text-xs），右侧保存状态（保存成功后显示「已保存」约 1.5s 淡出，参考 `resume-upload.tsx` 的 copied 模式）。
   - 保存用防抖或失焦触发均可，但必须避免每次击键写库；实现方式自选，注释说明。
3. `pages/workbench/ui/page.tsx`：`<ResumeUpload />` 之后挂 `<ResumeSupplementCard />`。
4. 验证同 Task 1。

## 任务间接口

- Task 2 依赖 Task 1 的 store 与 `@/shared/zod` 出口（`ResumeSupplementRecord` 类型）。
- Task 1 先行，Task 2 在其后实施。
