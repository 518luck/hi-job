
## 图标

大部分图标统一维护在 `shared/ui/icons.tsx` 中。

默认使用 `lucide-react` 提供的图标（与 `components.json` 的 `iconLibrary` 一致）。不要在业务代码中直接从图标库导入图标，也不要在组件内临时定义图标；应先在 `icons.tsx` 中统一注册，再通过 `Icons` 对象使用。`shared/ui/` 下由 shadcn CLI 生成的组件不受此约束。

注册图标时必须按业务语义命名，不要直接使用图标库原始名称；例如使用 `workbench`、`themeDark`，而不是 `LayoutDashboard`、`Moon`。

### 正确示例

添加图标：

```typescript
import { LayoutDashboard, Sun } from 'lucide-react';

export const Icons = {
  workbench: LayoutDashboard,
  themeLight: Sun,
};
```

使用的时候：

```typescript
import { Icons } from '@/shared/ui/icons';

<Icons.workbench className="size-4" />
```

### 错误示例

不要在业务组件中直接从 lucide-react 导入图标：

```typescript
import { LayoutDashboard } from 'lucide-react';

export function Header() {
  return <LayoutDashboard className="size-4" />;
}
```

不要在组件中内联 SVG：

```typescript
export function HeaderLogo() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="..." />
    </svg>
  );
}
```

新增图标时，应保持命名简洁、语义明确，并按语义分组放置。

## SVG 资源

少量自定义 SVG 图标存放在 `shared/assets/icons` 目录下（目录尚未创建，首次存放时建立）。

不要在应用代码中内联 SVG，也不要将 SVG 图标放到其他目录。新增或修改 SVG 文件前，应使用 SVGO 优化（如 `npx svgo icons/xxx.svg`）。
