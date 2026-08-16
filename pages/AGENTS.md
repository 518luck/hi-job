## JSX 渲染逻辑（避免多重三元）

- 禁止在 JSX 中嵌套多重三元（`a ? b : c ? d : e`），分支一多就不可读。
- 分支多时提取为**渲染函数 + 提前 return**：每个分支的文案/回调/图标完整放在一处，阅读顺序即逻辑顺序。
- 分支少时在组件顶部**提前计算变量**，JSX 只做渲染（如 `{viewSwitchButton}`）。

```tsx
// ✅ 渲染函数 + 提前 return
const renderViewSwitch = (): ReactElement | null => {
  if (isEditorOpen) {
    return <Button onClick={back}>…</Button>;
  }
  if (list.length !== 1) return null;
  return <Button onClick={switchTo}>…</Button>;
};

// ❌ 多重三元
{
  cond ? <A /> : cond2 ? <B /> : cond3 ? <C /> : null;
}
```

## React 状态管理

编写组件状态时，优先按作用范围判断，不要为了统一而过度抽象。页面级或功能流程级共享状态可以抽 Context，局部状态应保持在组件内或通过 props 表达。

### 判断优先级

- 只属于当前组件的状态，使用 `useState` 或组件内局部状态。
- 父子组件之间少量直接传递的状态，使用 props。
- 多个兄弟组件需要读写同一份状态，使用 Context。
- 跨页面或全局业务状态，考虑全局状态管理或持久化方案。
- 服务端数据不要放入 Context，优先使用数据请求。

### 什么时候使用 Context

- 同一份状态需要被多个兄弟组件读写。
- 状态不只属于某一个组件，而是属于整个页面或功能流程。
- 如果不用 Context，会出现明显的 props drilling。
- 状态包含多个相关字段和操作方法，例如表单步骤、登录方式、当前选中项、展开状态等。
- 状态需要被页面下多个 UI 片段协同使用。

Context 应放在当前 slice 的 `model/` 目录下，例如 `pages/xxx/model/xxx-context.tsx` 或 `widgets/xxx/model/xxx-context.tsx`。

### 什么时候不要使用 Context

- 状态只被一个组件使用。
- 只是父组件传给一两个直接子组件。
- 状态是纯 UI 临时状态，例如一个按钮 loading、一个弹窗开关。
- 可以简单通过 props 表达，而且不会造成层层传递。
- 状态属于服务端数据，应优先使用请求层。

### Context 编写要求

- Context 文件应包含明确的 `ContextType` 类型、Provider 组件和 `useXxxContext` 自定义 Hook。
- `useXxxContext` 内必须检查是否在 Provider 内部使用，并在缺失 Provider 时抛出明确错误。
- 不要直接导出原始 Context，外部统一通过 `useXxxContext` 访问。
- Provider 只包裹真正需要共享状态的页面区域，不要无意义扩大范围。

```ts
const XxxContext = createContext<XxxContextType | null>(null);

// 提供当前功能流程内共享的页面状态
function XxxProvider({ children }: PropsWithChildren) {
  // ...
}

// 读取当前功能流程内的共享页面状态
const useXxxContext = (): XxxContextType => {
  const context = useContext(XxxContext);

  if (context === null) {
    throw new Error('useXxxContext 必须在 XxxProvider 内部使用。');
  }

  return context;
};
```

## Slice 与 Segment

### 结构

- `pages`、`widgets` 下必须先建 slice，再建 segment，例如 `pages/favorites/ui/jd-card.tsx`；将来引入 `features`、`entities` 层时同样适用。
- `app` 和 `shared` 不拆 slice，直接按 segment 组织（本项目 shared 的实际 segment：`lib` / `ui` / `zod`）；`infra` 同样不拆 slice（当前 segment：`storage`）。
- `entrypoints/` 按 WXT 入口约定组织（background、sidepanel、content 等），视同 app 层：只做入口挂载与消息搬运，不承载业务。
- 常用 segment（按代码目的分组）：
  - `ui` — UI 显示相关：组件、样式、日期格式化等。
  - `model` — 数据模型：store、业务逻辑、DOM 解析（数据 schema 统一放 `shared/zod/`）。
  - `api` — 请求与接口封装。
  - `lib` — 本 slice 复用的工具代码。
  - `config` — 配置、常量、feature flags。
- 不要新建 `components`、`hooks`、`types` 这类只描述技术形态的顶层 segment，优先归入 `ui`、`model`、`api`、`lib`。

### 命名

slice 内的文件不必重复 slice 名（文件夹路径已经标注过了）。常用 segment 下的文件命名约定如下：

- **`ui/`** — 单个页面组件用通用名 `page.tsx`，组件名保留语义，由 `index.ts` 导出（`pages/favorites/ui/page.tsx` → `FavoritesPage`）。其余组件：有明确 UI 形态的直接用 UI 形态命名（`card.tsx`、`dialog.tsx`）；同一形态有多个时，用 UI 形态作前缀区分（`card-cluster.tsx`、`dialog-template-edit.tsx`）；无具体 UI 形态的按作用命名。
- **`model/`** — 数据获取 hook 用 `use-xxx.ts`；Context 用 `context-xxx.tsx`；纯函数/辅助按作用命名（如 `parse-jd.ts`）；数据 schema 一律放 `shared/zod/` 并从领域实体派生，不放 model。
- **`lib/`** — 工具/生成器按语义命名（`docx-builder.ts`、`format.ts`）。
- **`config/`** — 常量/枚举/静态配置，按内容命名（`constants.ts`、`menu-meta.ts`），内容简单时直接 `index.ts`。

### 导入边界

Layer 只能向下依赖：

```txt
app / entrypoints
→ pages
→ widgets
→ shared
→ infra
```

- pages 可以导入 widgets 和 shared，不能导入 app 与 entrypoints。
- widgets 只能导入 shared。
- shared 不能导入任何业务 layer。
- infra 只依赖 shared，不依赖任何业务 layer；各层均可向下使用 infra（如 `@/infra/storage`）。
- 同一 layer 的不同 slice 默认不能互相导入。
- 如果需要组合多个同层 slice，应放到更高 layer，例如在 pages 的页面里组合多个 widgets。

### 每个 slice 必须提供 index.ts 作为公有 API

```ts
// 正确
import { FavoritesPage } from '@/pages/favorites';

// 禁止：跨 slice 深层导入
import { FavoritesPage } from '@/pages/favorites/ui/page';
```

- index.ts 只导出外部真正需要使用的组件、函数和类型（如 favorites 导出 `startJdRecorder`，供内容脚本使用）。
- 禁止在 slice 公有 API 中使用 `export *` 无差别导出。
- slice 内部文件互相引用时使用相对路径。
- 不要从本 slice 的 index.ts 再导入本 slice 内部成员。

### 禁止事项

- 禁止低层导入高层。
- 禁止同层不同 slice 互相导入。
- 禁止绕过公有 API 深层导入其他 slice 内部文件。
- 禁止把具体业务逻辑放进 shared。
- 禁止把只用一次的页面局部 UI 过早抽到 widgets。

## 内容脚本 slice（world）

`pages/world/` 收纳全部内容脚本业务逻辑，按「世界 → 领域」两级组织：

- **世界**（slice）：`isolated-world/`（隔离世界）、`main-world/`（主世界），各自提供 `index.ts` 公有 API 聚合领域入口。
- **领域**（slice）：世界下按入口/职责划分（如 `main-world/chat-helper/`、`isolated-world/jd-listener/`），领域命名与 `entrypoints/` 的入口文件对应；未来新增功能并列新领域目录。
- 领域内部沿用 segment 约定（`model/` 等），入口文件只做薄装配（`defineContentScript` + 调 startXxx）。

世界约束：

- 主世界脚本拿不到 chrome API，需要扩展 API 的调用经 postMessage 桥（`shared/messaging` 的 bridge 协议）交给隔离世界转发。
- 桥协议常量与数据结构放 `shared/messaging/`（如 `vue-job-data.ts`），两世界共用，禁止在 slice 内重复定义。
- 读取页面 Vue 实例等私有对象统一用 `@/shared/lib/page-property` 的 `readProperty` / `stringOf`。
