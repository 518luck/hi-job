# 扩展更新提示功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打开侧边栏时后台检查 GitHub 新版本（1 小时缓存、jsDelivr 兜底、全静默失败），工作台标题右侧显示绿点更新提示，设置页版本行显示更新状态。

**Architecture:** 按需拉取模式——UI 挂载时经 ProtocolMap 消息 `checkUpdate()` 请求后台；后台读 Dexie 单行缓存（表 `updateCheck`），过期才 fetch GitHub Releases API，失败兜底 jsDelivr 镜像，结果（含失败）回写缓存 1 小时。UI 侧共用能力上移为 widget（同层页面禁互导）。

**Tech Stack:** WXT + React 19 + TypeScript + zod + Dexie + Biome。无测试框架，每任务以 `pnpm run typecheck` 为验证门槛。

## Global Constraints

- 所有新增函数/组件/常量上方写一行简短中文注释；zod 字段行尾中文注释（AGENTS.md 注释规范）。
- zod schema 集中 `shared/zod/`，落库实体为基座，派生 schema 同文件；上层只从 `@/shared/zod` 聚合入口导入。
- 禁止 `any`、`as`（惯用 `as const` 除外）、`@ts-ignore`、`biome-ignore`。
- 函数参数 ≥2 个用 options object 解构。
- 新文件名 kebab-case；React 组件用 `function` 声明，非组件函数用 `const` 箭头函数。
- 仓储以单对象导出、无状态、成员带行尾注释；db schema 变更只递增 version 写增量。
- 检查失败全程静默（无 toast、无报错弹窗、无 console 噪音）。

---

### Task 1: 版本比较工具与更新源常量

**Files:**
- Create: `shared/lib/version-compare.ts`
- Create: `shared/lib/update-source.ts`

**Interfaces:**
- Produces: `compareVersions(a: string, b: string): number`（正数 a 更新、负数 b 更新、0 相同）；常量 `GITHUB_RELEASE_API_URL`、`JSDELIVR_PACKAGE_URL`、`FALLBACK_RELEASE_URL`（Task 4/5 使用）。

- [ ] **Step 1: 写版本比较纯函数**

`shared/lib/version-compare.ts`：

```ts
// # 语义化版本比较：点分段数值逐段比较

// 比较两个点分版本号：正数表示 a 更新，负数表示 b 更新，0 表示相同；非数字段按 0 处理
const compareVersions = (a: string, b: string): number => {
  const partsOf = (version: string): number[] =>
    version.split('.').map((part) => {
      const parsed = Number.parseInt(part, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    });
  const left = partsOf(a);
  const right = partsOf(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
};

export { compareVersions };
```

- [ ] **Step 2: 写更新源常量**

`shared/lib/update-source.ts`：

```ts
// # 更新源常量：仓库、版本端点与回退链接集中一处，换仓只改这里

// 扩展发布的 GitHub 仓库（owner/name）
const UPDATE_REPO = '518luck/hi-job';

// 主版本源：最新 Release 元数据（tag_name + html_url）
const GITHUB_RELEASE_API_URL = `https://api.github.com/repos/${UPDATE_REPO}/releases/latest`;

// 兜底版本源：main 分支 package.json 的 version 字段（拿不到 release 页链接）
const JSDELIVR_PACKAGE_URL = `https://cdn.jsdelivr.net/gh/${UPDATE_REPO}@main/package.json`;

// 无 releaseUrl 时的回退跳转：永远指向最新 Release 页
const FALLBACK_RELEASE_URL = `https://github.com/${UPDATE_REPO}/releases/latest`;

export { FALLBACK_RELEASE_URL, GITHUB_RELEASE_API_URL, JSDELIVR_PACKAGE_URL };
```

- [ ] **Step 3: 类型检查**

Run: `pnpm run typecheck`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add shared/lib/version-compare.ts shared/lib/update-source.ts
git commit -m "feat: 新增版本比较工具与更新源常量"
```

---

### Task 2: update-check 数据字典

**Files:**
- Create: `shared/zod/update-check.ts`
- Modify: `shared/zod/index.ts`

**Interfaces:**
- Produces: 类型 `UpdateCheck`（落库实体）、`UpdateCheckStatus`（协议 DTO，Task 3/4/5 使用）；schema `updateCheckSchema`、`updateCheckStatusSchema`、`githubReleaseResponseSchema`、`jsdelivrPackageResponseSchema`；常量 `UPDATE_CHECK_KEY = 'global'`。

- [ ] **Step 1: 写数据字典文件**

`shared/zod/update-check.ts`：

```ts
// # update-check 表数据字典：远端版本检查缓存、协议 DTO 与外源响应契约
import { z } from 'zod';

// 单行固定主键：版本检查缓存只有一份，key 恒为 global
const UPDATE_CHECK_KEY = 'global';

// 表 updateCheck（版本检查缓存）落库实体：主键 key
const updateCheckSchema = z.object({
  key: z.literal(UPDATE_CHECK_KEY), // 单行固定主键
  lastCheckedAt: z.number(), // 上次检查的时间戳（ms），距今不足 TTL 时直接用缓存
  latestVersion: z.string().nullable(), // 远端最新版本号（已去 v 前缀），全部失败时为 null
  releaseUrl: z.string().nullable(), // 最新 release 页链接，镜像源取不到时为 null
  source: z.enum(['github', 'jsdelivr', 'unknown']), // 本次结果来源端点
});

// 协议返回的检查状态：去掉存储主键，附加本地动态字段
const updateCheckStatusSchema = updateCheckSchema
  .omit({ key: true })
  .extend({
    currentVersion: z.string(), // 当前安装版本（读 manifest）
    hasUpdate: z.boolean(), // 远端版本是否高于当前版本
  });

// GitHub Releases latest 接口响应的最小字段集（外源响应契约）
const githubReleaseResponseSchema = z.object({
  tag_name: z.string(), // 最新 Release 的 tag（约定 v 前缀 + 版本号）
  html_url: z.string(), // Release 页链接
});

// jsDelivr package.json 响应的最小字段集（外源响应契约）
const jsdelivrPackageResponseSchema = z.object({
  version: z.string(), // main 分支 package.json 的版本号
});

// 从 schema 派生类型，保持单一事实来源
type UpdateCheck = z.infer<typeof updateCheckSchema>;
type UpdateCheckStatus = z.infer<typeof updateCheckStatusSchema>;

export type { UpdateCheck, UpdateCheckStatus };
export {
  UPDATE_CHECK_KEY,
  githubReleaseResponseSchema,
  jsdelivrPackageResponseSchema,
  updateCheckSchema,
  updateCheckStatusSchema,
};
```

- [ ] **Step 2: 聚合出口登记**

`shared/zod/index.ts` 按现有字母序（resume 相关导出之后）添加：

```ts
// updateCheck 表：版本检查缓存 + 协议 DTO + 外源响应契约
export type { UpdateCheck, UpdateCheckStatus } from './update-check';
export {
  UPDATE_CHECK_KEY,
  githubReleaseResponseSchema,
  jsdelivrPackageResponseSchema,
  updateCheckSchema,
  updateCheckStatusSchema,
} from './update-check';
```

- [ ] **Step 3: 类型检查**

Run: `pnpm run typecheck`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add shared/zod/update-check.ts shared/zod/index.ts
git commit -m "feat: 新增版本检查数据字典"
```

---

### Task 3: 存储层（db v3 加表 + 仓储）

**Files:**
- Modify: `shared/infra/storage/db.ts`
- Create: `shared/infra/storage/update-check/update-check-store.ts`
- Create: `shared/infra/storage/update-check/index.ts`
- Modify: `shared/infra/storage/index.ts`

**Interfaces:**
- Consumes: Task 2 的 `UpdateCheck` 类型与 `UPDATE_CHECK_KEY`。
- Produces: `updateCheckStore.readUpdateCheck(): Promise<UpdateCheck | undefined>`、`updateCheckStore.saveUpdateCheck(record: UpdateCheck): Promise<void>`（Task 4 使用）；db 表 `updateCheck`。

- [ ] **Step 1: db.ts 注册表**

`shared/infra/storage/db.ts`：

import 类型列表（按字母序）加入 `UpdateCheck`；实例类型声明加入：

```ts
  updateCheck: EntityTable<UpdateCheck, 'key'>; // 版本检查缓存表（单行）
```

文件末尾（v2 声明之后）追加 v3 增量（stores 传全量表清单，v1/v2 声明原样保留）：

```ts
// v3：新增 updateCheck 表（远端版本检查缓存），stores 传全量表清单，历史声明原样保留
db.version(3).stores({
  jd: 'jobId, companyId, lastSeenAt',
  company: 'companyId, lastSeenAt',
  aiVendor: 'vendorId, name, updatedAt',
  hr: 'encryptBossId, lastMsgAt, lastChatAt, status',
  chatMessage: '[encryptBossId+msgId], encryptBossId, msgAt',
  debugSetting: 'key',
  blockedCompany: 'key',
  aiLog: '++id, createdAt',
  aiPreference: 'key',
  resume: 'key',
  consent: 'key',
  resumeSupplement: 'key',
  updateCheck: 'key',
});
```

- [ ] **Step 2: 写仓储**

`shared/infra/storage/update-check/update-check-store.ts`：

```ts
// # update-check 领域仓储：远端版本检查缓存的统一读写入口
import { UPDATE_CHECK_KEY, type UpdateCheck } from '@/shared/zod';

import { db } from '../db';

// 读取版本检查缓存：从未检查过时返回 undefined
const readUpdateCheck = (): Promise<UpdateCheck | undefined> =>
  db.updateCheck.get(UPDATE_CHECK_KEY);

// 保存版本检查缓存：单行覆盖写入
const saveUpdateCheck = async (record: UpdateCheck): Promise<void> => {
  await db.updateCheck.put(record);
};

// update-check 领域仓储：远端版本检查缓存的统一读写入口
const updateCheckStore = {
  readUpdateCheck, // 读取缓存（从未检查过时 undefined）
  saveUpdateCheck, // 覆盖写入缓存
};

export { updateCheckStore };
```

注意：debug-setting 仓储用两行 import（类型一行、常量一行）；如 Biome 导入排序报错，运行 `pnpm run fix` 自动整理。

`shared/infra/storage/update-check/index.ts`：

```ts
// # update-check 领域仓储公有 API
export { updateCheckStore } from './update-check-store';
```

- [ ] **Step 3: 聚合出口登记**

`shared/infra/storage/index.ts` 按字母序添加：

```ts
export { updateCheckStore } from './update-check';
```

- [ ] **Step 4: 类型检查**

Run: `pnpm run typecheck`
Expected: 无错误。

- [ ] **Step 5: Commit**

```bash
git add shared/infra/storage/db.ts shared/infra/storage/update-check shared/infra/storage/index.ts
git commit -m "feat: 新增版本检查缓存表与仓储"
```

---

### Task 4: 协议消息与后台编排

**Files:**
- Modify: `shared/infra/messaging/protocol.ts`
- Modify: `entrypoints/background.ts`

**Interfaces:**
- Consumes: Task 1 的 `compareVersions`/`GITHUB_RELEASE_API_URL`/`JSDELIVR_PACKAGE_URL`；Task 2 的 `UpdateCheckStatus`/`UpdateCheck`/`UPDATE_CHECK_KEY`/两个响应 schema；Task 3 的 `updateCheckStore`。
- Produces: 协议消息 `checkUpdate(): UpdateCheckStatus`（Task 5 的 hook 调用）。

- [ ] **Step 1: 协议登记**

`shared/infra/messaging/protocol.ts`：import type 列表按字母序加入 `UpdateCheckStatus`；ProtocolMap 内 `organizeResume` 行后添加：

```ts
  checkUpdate(): UpdateCheckStatus; // 侧边栏	后台	检查扩展新版本（后台自带 1 小时缓存），返回最新版本与是否有更新
```

- [ ] **Step 2: 后台编排实现**

`entrypoints/background.ts`：

import 区新增：

```ts
import { GITHUB_RELEASE_API_URL, JSDELIVR_PACKAGE_URL } from '@/shared/lib/update-source';
import { compareVersions } from '@/shared/lib/version-compare';
```

（storage 聚合 import 中加入 `updateCheckStore`；zod type import 加入 `UpdateCheck`、`UpdateCheckStatus`；zod schema import 加入 `githubReleaseResponseSchema`、`jsdelivrPackageResponseSchema`、`UPDATE_CHECK_KEY`。）

`resolveActiveVendor` 定义之前加入以下编排代码：

```ts
// 版本检查缓存有效期（1 小时）与单次请求超时（10 秒）
const UPDATE_CHECK_TTL_MS = 60 * 60 * 1000;
const UPDATE_FETCH_TIMEOUT_MS = 10_000;

// 进行中的检查：并发触发共享同一次网络检查
let inFlightCheck: Promise<UpdateCheckStatus> | undefined;

// 请求 JSON 并按 schema 校验：任一环节失败抛错，由调用方走兜底
const fetchJsonOf = async <T>(
  url: string,
  schema: z.ZodType<T>,
): Promise<T> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(UPDATE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
};

// 由检查结果计算协议状态：附加当前版本与是否有更新
const statusOf = ({
  latestVersion,
  releaseUrl,
  source,
  currentVersion,
}: Omit<UpdateCheck, 'key' | 'lastCheckedAt'> & {
  currentVersion: string;
}): UpdateCheckStatus => ({
  latestVersion,
  releaseUrl,
  source,
  currentVersion,
  hasUpdate:
    latestVersion !== null && compareVersions(latestVersion, currentVersion) > 0,
});

// > 检查扩展更新：缓存不足 1 小时直接返回；过期才请求网络，GitHub 主源失败走 jsDelivr 镜像，全失败记未知且同样缓存 1 小时
const handleCheckUpdate = async (): Promise<UpdateCheckStatus> => {
  const currentVersion = browser.runtime.getManifest().version;
  const cached = await updateCheckStore.readUpdateCheck();
  if (
    cached !== undefined &&
    Date.now() - cached.lastCheckedAt < UPDATE_CHECK_TTL_MS
  ) {
    return statusOf({ ...cached, currentVersion });
  }
  if (inFlightCheck === undefined) {
    inFlightCheck = (async () => {
      let latestVersion: string | null = null;
      let releaseUrl: string | null = null;
      let source: UpdateCheck['source'] = 'unknown';
      try {
        const release = await fetchJsonOf(
          GITHUB_RELEASE_API_URL,
          githubReleaseResponseSchema,
        );
        latestVersion = release.tag_name.replace(/^v/, '');
        releaseUrl = release.html_url;
        source = 'github';
      } catch {
        try {
          const pkg = await fetchJsonOf(
            JSDELIVR_PACKAGE_URL,
            jsdelivrPackageResponseSchema,
          );
          latestVersion = pkg.version.replace(/^v/, '');
          source = 'jsdelivr';
        } catch {
          // 兜底也失败：记未知，静默返回
        }
      }
      const record = {
        key: UPDATE_CHECK_KEY,
        lastCheckedAt: Date.now(),
        latestVersion,
        releaseUrl,
        source,
      };
      await updateCheckStore.saveUpdateCheck(record);
      return statusOf({ ...record, currentVersion });
    })().finally(() => {
      inFlightCheck = undefined;
    });
  }
  return inFlightCheck;
};
```

消息注册区 `organizeResume` 行后添加：

```ts
  onMessage('checkUpdate', () => handleCheckUpdate());
```

- [ ] **Step 3: 类型检查**

Run: `pnpm run typecheck`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add shared/infra/messaging/protocol.ts entrypoints/background.ts
git commit -m "feat: 后台新增扩展更新检查编排与消息"
```

---

### Task 5: 更新提示 UI（widget + 两页接入 + manifest 权限）

**Files:**
- Create: `widgets/update-notice/model/use-update-status.ts`
- Create: `widgets/update-notice/ui/update-badge.tsx`
- Create: `widgets/update-notice/index.ts`
- Modify: `pages/workbench/ui/page.tsx:154`
- Modify: `pages/settings/ui/page.tsx:93-96`
- Modify: `wxt.config.ts:31`

**Interfaces:**
- Consumes: Task 4 的 `sendMessage('checkUpdate')`；Task 1 的 `FALLBACK_RELEASE_URL`。
- Produces: widget 公有 API `UpdateBadge`（工作台用）、`useUpdateStatus`（设置页用）。

- [ ] **Step 1: 写共用 hook**

`widgets/update-notice/model/use-update-status.ts`：

```ts
import { useEffect, useState } from 'react';

import { sendMessage } from '@/shared/infra/messaging';
import type { UpdateCheckStatus } from '@/shared/zod';

// 工作台与设置页共用的更新状态：挂载时问后台要一次（后台自带 1 小时缓存）
const useUpdateStatus = (): { status?: UpdateCheckStatus } => {
  const [status, setStatus] = useState<UpdateCheckStatus>();

  useEffect(() => {
    // 检查失败静默处理：调用方拿到 undefined 即不渲染任何提示
    sendMessage('checkUpdate')
      .then(setStatus)
      .catch(() => undefined);
  }, []);

  return { status };
};

export { useUpdateStatus };
```

- [ ] **Step 2: 写绿点徽标组件**

`widgets/update-notice/ui/update-badge.tsx`：

```tsx
import { FALLBACK_RELEASE_URL } from '@/shared/lib/update-source';

import { useUpdateStatus } from '../model/use-update-status';

// 工作台标题右侧的更新提示：有新版本才渲染绿点 + 版本号，点击打开更新页
function UpdateBadge() {
  const { status } = useUpdateStatus();
  if (status === undefined || !status.hasUpdate) {
    return null;
  }

  // 打开更新页：优先 release 页链接，镜像源没有时回退固定的 latest 页
  const openUpdatePage = (): void => {
    void browser.tabs.create({
      url: status.releaseUrl ?? FALLBACK_RELEASE_URL,
    });
  };

  return (
    <button
      type="button"
      title="有新版本，点击查看更新"
      onClick={openUpdatePage}
      className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50"
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span>有新版本 v{status.latestVersion ?? ''}</span>
    </button>
  );
}

export { UpdateBadge };
```

- [ ] **Step 3: widget 公有 API**

`widgets/update-notice/index.ts`：

```ts
// # update-notice slice 公有 API
export { useUpdateStatus } from './model/use-update-status';
export { UpdateBadge } from './ui/update-badge';
```

- [ ] **Step 4: 工作台标题接入**

`pages/workbench/ui/page.tsx`：import `UpdateBadge`（`@/widgets/update-notice`，与 `@/widgets/nav-bar` 的 type import 相邻按序放置）。将：

```tsx
      <h2 className="text-base font-medium">工作台</h2>
```

替换为：

```tsx
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium">工作台</h2>
        {/* 有新版本时右侧出现绿点提示，无新版本不占位 */}
        <UpdateBadge />
      </div>
```

- [ ] **Step 5: 设置页版本行接入**

`pages/settings/ui/page.tsx`：import `useUpdateStatus`（`@/widgets/update-notice`）与 `FALLBACK_RELEASE_URL`（`@/shared/lib/update-source`）。

主组件下方（`export` 之前）添加辅助组件：

```tsx
// 设置页底部的更新状态：紧随版本号展示「当前为最新」或可点的新版本跳转，未知时不显示
function VersionUpdateStatus() {
  const { status } = useUpdateStatus();
  // 加载中或检查失败（latestVersion 为 null）：不显示任何状态
  if (status === undefined || status.latestVersion === null) {
    return null;
  }
  if (!status.hasUpdate) {
    return <span className="ml-1">· 当前为最新</span>;
  }
  return (
    <button
      type="button"
      className="ml-1 cursor-pointer underline underline-offset-2 outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      onClick={() => {
        void browser.tabs.create({
          url: status.releaseUrl ?? FALLBACK_RELEASE_URL,
        });
      }}
    >
      有新版本 v{status.latestVersion}，点击查看
    </button>
  );
}
```

版本号段落替换为：

```tsx
        {/* 版本号：读取已安装扩展的 manifest，与 package.json 构建时自动同步 */}
        <p className="pt-1 text-xs text-muted-foreground/60">
          v{browser.runtime.getManifest().version}
          <VersionUpdateStatus />
        </p>
```

- [ ] **Step 6: manifest 权限**

`wxt.config.ts` 的 `host_permissions` 改为：

```ts
    // zhipin 主机权限：内容脚本注入与后台按 URL 查找标签页（上下文查询、名单广播）都依赖它
    // 更新检查：GitHub Releases API 与 jsDelivr 镜像两个固定端点
    host_permissions: [
      '*://*.zhipin.com/*',
      'https://api.github.com/*',
      'https://cdn.jsdelivr.net/*',
    ],
```

- [ ] **Step 7: 类型检查与 lint**

Run: `pnpm run typecheck && pnpm run lint`
Expected: 均无错误。

- [ ] **Step 8: Commit**

```bash
git add widgets/update-notice pages/workbench/ui/page.tsx pages/settings/ui/page.tsx wxt.config.ts
git commit -m "feat: 工作台与设置页新增版本更新提示"
```

---

### Task 6: 全量验证与手动场景

**Files:** 无新文件。

**Interfaces:**
- Consumes: 全部前序任务成果。

- [ ] **Step 1: 全量检查**

Run: `pnpm run typecheck && pnpm run fix`
Expected: typecheck 无错误；fix 无剩余问题（如有格式调整会自动写入）。

- [ ] **Step 2: 构建冒烟**

Run: `pnpm run build`
Expected: 构建成功，manifest 中含两个新 host 权限。

- [ ] **Step 3: 手动验证清单（用户执行）**

1. `pnpm run dev` 加载扩展，打开侧边栏：工作台标题右侧无提示（当前 0.4.0 即最新），设置页版本行显示「· 当前为最新」。
2. 临时把 `package.json` 与 manifest 版本改低（如 0.3.0）重载：工作台出现绿点「有新版本 v0.4.0」，点击打开 release 页；设置页显示「有新版本 v0.4.0，点击查看」。验证完改回 0.4.0。
3. 断网重载侧边栏：两处均静默无提示、无报错（DevTools 无未捕获异常）。

- [ ] **Step 4: 收尾提交**

```bash
git add -A
git commit -m "chore: 更新提示功能验证收尾"
```

（如 fix/build 无产生变更则跳过此提交。）
