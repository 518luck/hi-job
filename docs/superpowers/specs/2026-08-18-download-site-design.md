# hi-job 下载站设计（GitHub Releases + Pages）

日期：2026-08-18
状态：已确认（用户逐节审阅通过）

## 背景与目标

hi-job（更好用的 boss 直聘）目前只能克隆仓库本地构建安装。目标：为最终用户提供一个免开发知识的安装渠道——

1. **下载**：GitHub Releases 托管扩展 zip，提供永远指向最新版的固定下载链接
2. **落地页**：GitHub Pages 托管中文产品落地页（功能介绍 + 下载 + 安装教程 + FAQ）
3. **自动化**：GitHub Actions 自动完成「打 tag → 构建 → 发 Release」与「改页面 → 自动部署」

仓库 `518luck/hi-job` 为 PUBLIC，满足 GitHub Pages 免费版要求。

## 已确认的决策

| 决策点 | 结论 |
| --- | --- |
| 内容范围 | 完整产品落地页（非极简下载页） |
| 截图素材 | 使用真实截图；实现时用 onError 占位框兜底，截图后补 |
| 国内镜像 | 本次不做 Cloudflare Pages 镜像；页面不写镜像说明，仅按钮旁提示访问不畅可稍后重试 |
| 技术方案 | `site/` 独立 Vite 站（独立 package.json + lockfile，不入 pnpm workspace） |

## 架构

- **site/**：Vite + React 19 + TypeScript + Tailwind CSS v4 单页站，独立 `package.json` 与 lockfile，与扩展代码零耦合
- **主题**：从 `app/app.css` 复制 shadcn 明暗两套主题变量，`prefers-color-scheme` 跟随系统，不设手动切换按钮；图标 lucide-react
- **部署地址**：`https://518luck.github.io/hi-job/`，Vite `base` 设 `/hi-job/`（绑自定义域名时改一行）
- **扩展侧零改动**：不触碰 entrypoints / pages / shared 等目录

## 页面结构（单页滚动，自上而下）

1. **顶部导航**：产品名 + GitHub 仓库链接
2. **Hero**：README 首段价值主张 + 大下载按钮 + 徽章（免费 / 开源 / 数据本地存储）
   - 下载固定直链：`https://github.com/518luck/hi-job/releases/latest/download/hi-job-chrome.zip`，按钮旁小字提示「下载不畅可稍后重试」
   - 版本号动态拉取 `https://api.github.com/repos/518luck/hi-job/releases/latest`，失败时显示「最新版本见 GitHub Releases」，不阻塞页面
3. **功能特性**：四张卡片——AI 求职助手 / 职位自动记录 / HR 沟通管理 / 屏蔽公司，内容浓缩自 README
4. **截图区**：约定文件名（`site/public/screenshots/` 下 `workbench.png`、`chat.png`、`records.png`），`<img onError>` 显示虚线占位框，放入真实截图后自动替换，无需改代码
5. **安装教程**：下载 zip → 解压到不会删除的目录 → `chrome://extensions` → 开发者模式 → 加载已解压；附更新说明（重新下载新版、加载新解压目录；manifest 已钉死扩展 ID，数据不丢）
6. **FAQ**：更新丢数据吗 / 数据安全吗 / 支持哪些浏览器（Chrome、Edge 等 Chromium；Firefox 暂不提供）/ 免费吗
7. **Footer**：GitHub 链接、隐私一句话、免责声明一句话

## 发布流水线

### `.github/workflows/release.yml`（打 `v*` tag 触发）

1. 校验 tag 与 `package.json` 的 `version` 一致，不一致直接失败
2. `pnpm install && pnpm zip`，产物重命名为固定名 `hi-job-chrome.zip`（WXT 默认文件名带版本号，重命名后固定链接才成立）
3. `softprops/action-gh-release` 创建 Release 附 zip，notes 用 GitHub 自动生成（含 diff 链接）

### `.github/workflows/deploy-site.yml`（push main 且 `site/**` 变更触发，另留 workflow_dispatch 手动入口）

1. `site/` 内 `pnpm install && pnpm build`
2. `actions/upload-pages-artifact` + `actions/deploy-pages` 官方链路部署

发版与页面部署解耦：改文案只重发页面；发新版本只打 tag。

## 上线步骤（一次性人工操作）

1. 合并代码后：仓库 **Settings → Pages → Source 选 "GitHub Actions"**
2. 打 `v0.1.0` tag 推送，端到端验证 Release 产物与下载链接
3. 后续提供截图放入 `site/public/screenshots/`，推 main 自动更新

## 验证方式

- `site/` 内 `pnpm build` 通过、`pnpm dev` 本地预览
- 根项目 `pnpm run typecheck` 确认扩展侧不受影响
- 打 `v0.1.0` tag 真实发版作为流水线端到端验证

## 明确不做（YAGNI）

- Cloudflare Pages 国内镜像（将来需要时另起）
- Firefox 版本分发（AMO 签名链路）
- 落地页明暗手动切换、自定义域名、多语言
- Chrome Web Store 上架（长期正路，另行决策）
