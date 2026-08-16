# AI 代理开发指南

## 概述

## 产品本质（重要）

## 项目结构

**技术栈**：WXT + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui（base-nova）+ Biome，包管理器 pnpm。默认构建 Chrome MV3 扩展（`-b firefox` 可切 Firefox）。

```
hi-job/
├── app/                    # 全局应用层
│   ├── app.css             # 全局样式：Tailwind + shadcn 主题变量（明/暗两套）
│   └── providers/          # 全局 Provider 组合根（AppProvider）
├── pages/                  # 页面 slice 层，结构/命名/导入边界规范见 pages/AGENTS.md
│   ├── favorites/          # ui=页面与展示组件，model=JD 解析/存储/自动记录，index.ts=公有 API
│   ├── workbench/          # 工作台页：最近职位卡片流 + AI 打招呼的厂商/模型选择，index.ts=公有 API
│   └── world/              # 内容脚本逻辑层：按「世界 → 领域」组织（非 UI 页面）
│       ├── rpc/            # 两世界共享 RPC：window-rpc 传输与方法表（Vue DTO 在 shared/zod）
│       ├── isolated-world/ # 隔离世界 slice：jd-listener 职位监听、runtime-bridge 桥转发
│       └── main-world/     # 主世界 slice：vue-job-data 数据提供、chat-helper、chat-probe、jd-probe
├── widgets/                # 独立功能小组件（nav-bar 导航栏等）
├── shared/                 # 跨入口共享层
│   ├── lib/                # 工具函数（cn、page-property 等）
│   ├── ui/                 # shadcn/ui 组件（CLI 生成源码，可自由修改）
│   ├── zod/                # zod 数据字典：一表一文件 + index.ts 聚合出口（实体基座 + 派生）
│   └── infra/              # 基础设施域，规范见 shared/infra/AGENTS.md
│       ├── messaging/      # 消息域：扩展消息协议（ProtocolMap 收发，隔离世界/侧边栏 ↔ 后台）
│       ├── storage/        # 存储域：Dexie 数据库（IndexedDB）+ 按领域划分的仓储（jd 等）
│       └── ai/             # AI 域：厂商客户端（供应商实例、模型拉取、文本生成）
├── entrypoints/            # 扩展入口目录（文件名约定决定入口类型，见下表）
│   ├── background.ts       # 后台 Service Worker
│   ├── content.ts          # 内容脚本（matches 决定注入哪些站点）
│   └── sidepanel/          # 侧边栏面板（React 挂载，点工具栏图标展开）
├── assets/                 # 参与构建的静态资源（import 引用，经 Vite 处理）
├── public/                 # 原样复制的静态资源（不经构建处理）
│   └── icon/               # 扩展图标，WXT 自动发现并写入 manifest
├── wxt.config.ts           # WXT 配置（模块注册、Vite 插件、manifest 定制）
├── components.json         # shadcn CLI 配置（ui 别名指向 @/shared/ui）
├── biome.json              # Biome lint / 格式化配置（已开启 tailwindDirectives）
├── tsconfig.json           # 继承 .wxt/ 生成的 tsconfig，声明 @/* 别名
├── .wxt/                   # wxt prepare 生成的类型与虚拟模块（勿手改，已 gitignore）
└── .output/                # 构建产物（已 gitignore）
```

### 入口约定（WXT 文件式入口）

manifest 由 `entrypoints/` 下的文件名约定自动生成，**无需手写 manifest.json**：

| 文件 / 目录         | 入口类型   | 说明                                       |
| ------------------- | ---------- | ------------------------------------------ |
| `background.ts`     | 后台脚本   | Service Worker，长驻逻辑、消息中枢         |
| `sidepanel/index.html` | 侧边栏面板 | Chrome Side Panel，点工具栏图标在浏览器左侧展开 |
| `xxx.content.ts(x)` | 内容脚本   | 注入匹配网页，`matches` 写在文件内         |
| `options/index.html`| 设置页     | 扩展选项页（按需新增）                     |

- 入口带配套文件（组件、样式等）时，放 `entrypoints/<name>/` 目录，以 `index.*` 为入口。
- WXT API（`defineBackground`、`defineContentScript`、`browser` 等）自动导入，无需手写 import。
- 路径别名：`@/` 指向项目根目录；`/xxx.png` 指向 `public/` 下的文件。

## 命令

## shadcn 组件安装

**必须使用 `npx` 安装 shadcn 组件，不要用 `pnpm dlx`。**

```bash
npx shadcn@latest add <component>
```

原因：项目通过 pnpm 安装的 `shadcn` 是带 bug 的旧版（zod 版本冲突导致 `ERR_PACKAGE_PATH_NOT_EXPORTED` 崩溃）。`pnpm dlx` 会复用本地 store 里这个带 bug 的版本，仍然崩溃；而 `npx` 走 npm 的通道，每次拉取最新版（含官方修复），可正常使用。

## 上下文感知加载

### pages / widgets 层

页面与组件的 JSX 渲染、状态管理、slice/segment 结构与导入边界规范，参见 `pages/AGENTS.md`。

### shared 层

shared 层的图标与 SVG 资源规范，参见 `shared/AGENTS.md`。

### infra 域

基础设施域（`shared/infra`）的定位、依赖规则与当前域说明，参见 `shared/infra/AGENTS.md`。

### 跨环境通信

| 通道 | 发起方 | 接收方 | 实现 |
| --- | --- | --- | --- |
| 扩展消息 | 隔离世界/侧边栏 | 后台 Service Worker | `@webext-core/messaging` 的 `ProtocolMap` |
| Window RPC | 主世界 | 隔离世界 | `pages/world/rpc/window-rpc.ts` |
| Window RPC | 隔离世界 | 主世界 | `pages/world/rpc/window-rpc.ts` |

Window RPC 方法按执行边界命名：`background.call` 是哑管道——隔离世界不逐方法登记，任何 ProtocolMap 消息原样转发后台，类型由调用处泛型与后台 handler 两端约束；`vue.*` 表示请求主世界读取页面 Vue 数据。所有 Window RPC 统一使用 namespace、version、request/response、request id、超时和错误结构；**两条通道各用独立 namespace（vue 数据服务 / 后台桥），服务端只应答本通道请求，同窗多服务端靠 namespace 区分，禁止共用**；业务代码不得直接拼接 `postMessage` 信封。另有单向通知通道（`hi-job/window-notify`）：后台推送经隔离世界桥转发主世界，用于标记变更等事件驱动同步，禁止用轮询替代。

两条铁律：

1. 主世界不能访问扩展 API，必须通过 Window RPC 交给隔离世界；隔离世界与后台使用 `@webext-core/messaging`。
2. Window RPC 只能解决通信与协议一致性，不能把主世界当作安全边界；页面自身脚本可以观察同窗消息，因此不得通过消息传递敏感凭据。

消息协议定义：`shared/infra/messaging/protocol.ts`（扩展消息）、`pages/world/rpc/window-methods.ts`（Window RPC 方法表）、`pages/world/rpc/window-rpc.ts`（Window RPC 传输层）。

## 代码风格指南

优先遵循目标区域中已有的模式；以下为通用默认规则。

### TypeScript 与类型

- 所有新代码使用 TypeScript；避免使用 `any`。
- 所有数据 schema（落库实体、跨环境 DTO、消息信封、表单校验）统一放在 `shared/zod/`，一个落库实体一个文件，文件名与表名一致；从该实体派生的 schema 放同一文件。
- 上层统一从 `@/shared/zod` 聚合入口导入，禁止深层导入字典内具体文件；字典内部重组不影响调用方。
- 落库实体字段最全、作为基座；其余 schema 必须从基座派生（`omit` / `pick` / `extend` 附加校验），禁止从零重新声明字段。
- 类型一律从 schema 用 `z.infer` 派生，不手写重复的 interface。
- zod schema 的每个字段必须在行尾用简短中文注释说明字段含义（业务语义或取值来源），让 schema 自带数据字典。
- 公共 API 和导出函数优先使用显式返回类型。
- 类型专用导入使用 `import type`。
- 除非局部合理，避免非空断言（`!`）。
- 避免使用类型断言（`as`）；优先通过 zod schema 解析、类型守卫或函数签名约束获得类型安全；仅 `as const` 等惯用写法除外。
- 不可变结构优先使用 `readonly` 和 `as const`。
- React 组件必须使用 `function` 声明, 非组件函数应优先使用 `const` 箭头函数，自定义 Hook 视为非组件函数，应使用 `const` 箭头函数。
- 优先使用显式 `import`/`export`，而非 `*`。
- 优先使用变量解构，而非属性访问。
- 绝不使用 `@ts-ignore`、`@ts-expect-error` 抑制类型错误；修复根因。

### React 事件类型

- React 表单提交事件禁止使用已弃用的 `FormEvent` / `FormEventHandler`；`onSubmit` 使用从 `"react"` 导入的 `SubmitEvent<HTMLFormElement>` 或 `SubmitEventHandler<HTMLFormElement>`。

### 类型检查

使用项目脚本进行检查，不直接运行底层工具，除非本文件明确说明。

- 类型检查：`pnpm run typecheck`
- 不要直接运行 `tsc`；使用 `pnpm run typecheck`，以保持和项目脚本一致。

### Lint

- Lint：`pnpm run lint`
- 绝不使用 `biome-ignore` 抑制 lint 错误；修复根因。
- 例外：若确认是 biome 规则误报（如与 W3C/浏览器标准冲突），可用行内 `// biome-ignore lint/...: <具体理由>` 抑制，理由必须写明依据。

### 命名

- 类、类型和 React 组件使用 `PascalCase`。
- 函数、变量和对象键使用 `camelCase`。
- 新文件名必须使用 `kebab-case`（中划线分隔的小写），除非已有约定要求其他格式。
- 使用描述性名称；避免在紧凑循环之外使用单字母名称。
- 高阶函数（接收 handler/component 为主参数，包一层增强后再返回，注入额外上下文如 session、权限、路由、主题等）统一命名为 `withXxx`，例如 `withSession`、`withPermission`。

### 控制流与错误处理

- 简洁优先，不写多余防御代码。
- 优先使用提前返回和正向条件,避免双重否定、德摩根式判断和需要反复脑内取反的表达式。
- 错误处理只在实际操作处用 try/catch；保持异步逻辑线性，尽量避免嵌套的 try 块。
- 能用 || "" 等回退值解决类型问题就不要 throw。
- 显式处理错误；API 尽可能返回有类型的错误。

### React / UI 约定

- 使用函数式组件；显式声明 props 类型。
- 表单统一用 TanStack Form（`@tanstack/react-form`）：校验 schema 从 `shared/zod` 派生并以表单级 `validators.onSubmit` 挂载（错误自动映射到字段），字段渲染走 `form.Field` render props，不手写逐字段 `useState`。
- 将 hooks 保持在顶层；避免条件式 hooks。
- 除非与文件约定一致，避免内联样式。

### Tailwind CSS

- 引用 CSS 变量的 arbitrary value 用 v4 简写 `prop-(--var)`，不要写 `prop-[var(--var)]`；计算表达式（如 `[calc(...)]`、`[min(...)]`）除外。

### Options Object

函数/方法/构造函数满足**任一**条件即用参数对象，禁止位置参数：参数 ≥ 2、含可选参数、含布尔标志、或多个同类型参数。

- 定义具名 `XxxOptions` interface，解构传入；可选字段在解构处给默认值，例如 `constructor({ code, message = "" }: HttpErrorOptions)`。

### 注释规范

- 所有新增或重写的函数、组件、类、导出常量和非平凡逻辑块上方，必须添加一行简短中文单行注释。
- 注释说明这段代码的业务目的或设计意图，不要复述语法。
- import、简单类型声明、简单常量、明显的 JSX 结构不强制添加注释。
- **注释只写"当前代码在做什么"，不写"为什么这么改"**：变更理由属于 git commit message，不是注释。防御性否定（"为什么不那样做"）同理删掉，除非是真实陷阱（如 `??` 对 null 的行为）。

#### 注释层次标记（务必遵循）

符号前缀（`#` `@` `>` `!` `?`）**只用于章节标题和重点标记，不是每条注释都要加**。大部分注释保持普通灰色。

| 符号 | 用途         | 用在哪                                                                               | 频率 |
| ---- | ------------ | ------------------------------------------------------------------------------------ | ---- |
| `#`  | 文件级标题   | 文件首个可执行代码（`"use client"` / `"use server"` 指令除外）之前，整个文件唯一一条 | 极少 |
| `@`  | 章节分组标题 | 把相关的几个常量/函数/类型归为一组时的标题                                           | 少   |
| `>`  | 重点说明     | 需要注意/重要的函数或逻辑，代替普通注释强调                                          | 少   |
| `!`  | 警示         | 坑、危险操作、重要约束、安全相关                                                     | 极少 |
| `?`  | 疑问         | 待确认的逻辑、待讨论的方案                                                           | 极少 |

**`#` 文件标题的位置**：必须放在 `import` 或首个声明之前。若文件开头有 `"use client"` / `"use server"` / `"use strict"` 等指令，`#` 标题写在指令之后、`import` 之前——指令必须是文件第一行。

**核心原则**：符号是"路标"不是"装饰"。一份文件里应该只有少数几个 `#`/`@` 标题，`>` 用于真正需要强调的地方，其余注释保持普通灰色。如果每条注释都带符号，等于没有层次。

**JSX 内的注释语法**：JSX 内必须用 `{/* 注释 */}` 形式，不能用裸 `//`。若要让 Better Comments 层次标记（`#` `@` `>` `!` `?`）在 JSX 内生效，符号前缀**必须写在 `/* */` 内的 `//` 之后**。

```tsx
// ❌ 错误：标记前没有 //，Better Comments 不识别
{
  /* @ 快捷操作工具栏 */
}

// ✅ 正确：/* */ 内带 //，Better Comments 才能高亮
{
  /* // @ 快捷操作工具栏 */
}
```

### 组件声明顺序

- 默认导出或对外导出的主组件放在文件上方。
- 主组件下方的辅助组件、工具函数，按主组件内从上到下的引用顺序声明。

### 类组织风格

- 私有属性放在最前面，构造函数紧随其后。
- 公开方法放中间，核心功能在前，辅助方法在后。
- 私有方法统一放在类的最底部，使用 `_` 前缀命名。

```typescript
class StorageClient {
  private bucket: string;          // ① 私有属性

  constructor() { ... }            // ② 构造函数

  async upload() { ... }           // ③ 公开方法（核心）
  async getSignedUrl() { ... }     // ③ 公开方法（辅助）

  private _resolveBucket() { ... } // ④ 私有方法（最底部）
}
```

## 验证命令

完成代码修改后，根据变更范围运行相关检查：

- 类型检查：`pnpm run typecheck`
- Lint 检查与自动修复（含导入排序、格式化）：`pnpm run fix`

## 贡献规范

- 不确定时：多读代码；仍然无法解决时，提供简短的选项后提问。绝不猜测。
- 修复根因（而非表面修补）。
- 聚焦变更；避免无关重构。
- 行为或用法变更时，同步更新文档和测试。
- 绝不通过删除、跳过或注释掉测试来使其通过；修复底层代码。
