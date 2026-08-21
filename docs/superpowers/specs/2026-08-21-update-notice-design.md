# 扩展更新提示功能设计

## 背景与目标

扩展通过 GitHub Releases 手动分发（非商店渠道），用户无法自动收到更新。本功能在检测到 GitHub 上有已发布的新版本时，于侧边栏给出轻量提示并引导用户前往更新页。

**触发模型（按需拉取）**：仅当用户打开侧边栏（工作台或设置页挂载）时才发起检查；浏览器在线但侧边栏未打开时零请求。不使用 `chrome.alarms` 后台轮询，不新增 alarms 权限。

## 展示需求

- **工作台**：标题「工作台」右侧，有新版本时渲染绿点 + 「有新版本 vX.Y.Z」，hover 提示「点击查看更新」，点击跳转更新页；无新版本 / 未知 / 加载中不渲染任何内容。
- **设置页**：现有版本号 `v0.4.0` 行旁显示状态：有新版本 → 「有新版本 vX.Y.Z ↗」（可点击跳转）；无新版本 → 「当前为最新」；未知 → 只显示版本号不显示状态。

## 数据与协议

- 新表 `update_check`（Dexie 单行表，模式照抄 `debug-setting`）：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `key` | `string` | 固定值单行主键 |
| `lastCheckedAt` | `number` | 上次检查时间戳 |
| `latestVersion` | `string \| null` | 远端最新版本号（去 `v` 前缀），未知为 null |
| `releaseUrl` | `string \| null` | release 页链接，镜像源取不到时为 null |
| `source` | `'github' \| 'jsdelivr' \| 'unknown'` | 本次结果来源 |

- schema 放 `shared/zod/update-check.ts`：落库实体为基座，派生协议 DTO `UpdateCheckStatus`（附加动态字段 `currentVersion`、`hasUpdate`）。
- `shared/infra/storage/db.ts` 递增 `version` 只写增量加表；新增仓储 `shared/infra/storage/update-check/`（读写各一，模式照 debug-setting-store）。
- 协议新增 `checkUpdate(): UpdateCheckStatus`（侧边栏 → 后台，非流式直接返回，先例 `organizeResume`）。

## 后台检查编排（entrypoints/background.ts）

1. 读缓存，距 `lastCheckedAt` 不足 1 小时 → 直接计算状态返回，不发网络请求。
2. 过期 → fetch `https://api.github.com/repos/518luck/hi-job/releases/latest`（10 秒超时），成功取 `tag_name`（去 `v`）与 `html_url`。
3. 失败 → 兜底 fetch `https://cdn.jsdelivr.net/gh/518luck/hi-job@main/package.json`，取 `version` 字段（无 releaseUrl）。
4. 都失败 → `latestVersion: null`、`source: 'unknown'`，**同样缓存 1 小时**，避免每次打开侧边栏都撞失败请求。
5. in-flight 去重：并发触发共享同一次进行中的请求。
6. 版本比较纯函数 `compareVersions(a, b)` 放 `shared/lib/`（点分段数值逐段比较）；`hasUpdate = compareVersions(latest, current) > 0`，`current = browser.runtime.getManifest().version`。
7. 仓库 owner/name、端点 URL、回退链接等常量集中一个文件，换仓只改一处。

**manifest 变更**：`host_permissions` 新增 `https://api.github.com/*` 与 `https://cdn.jsdelivr.net/*`（固定 origin，走声明式权限而非 optional 授权流）。

**跳转链接策略**：优先 API 返回的 release 页 `html_url`；镜像源或未知时回退固定的 `https://github.com/518luck/hi-job/releases/latest`。如需改指官网落地页，只改常量文件。

## UI（新 widget `widgets/update-notice/`）

同层页面禁止互导，两页共用能力上移为 widget：

- `model/use-update-status.ts`：挂载时 `sendMessage('checkUpdate')` 一次，返回状态（含加载中）。
- `ui/update-badge.tsx`（`UpdateBadge`）：绿点 + 版本文案，点击 `browser.tabs.create({ url })` 打开更新页（侧边栏内 `window.open` 不适用）。
- 工作台 `pages/workbench/ui/page.tsx` 标题行右侧插入 `<UpdateBadge />`；设置页 `pages/settings/ui/page.tsx` 版本行复用同一 hook 渲染文字状态。

## 错误处理与边界

- 超时、HTTP 非 200、403 限流、JSON 解析失败、版本号非点分格式 → 一律当失败处理（走兜底或记未知），全程静默，无 toast 无弹窗，主功能零感知。
- 扩展重载 / Service Worker 重启：缓存持久在 Dexie，1 小时窗口内不重查。
- 首次安装缓存为空：打开侧边栏即触发首次检查。

## 验证

- `pnpm run typecheck`、`pnpm run lint` 通过。
- 手动场景：本地版本改低 → 工作台出现绿点与「有新版本」，设置页出现可点状态；正常同版本 → 「当前为最新」；断网 → 全静默无提示无报错。

## 非目标

- 不自动下载或应用更新；不做强制升级拦截；不做发布渠道多仓配置；不引入 alarms 定时轮询。
