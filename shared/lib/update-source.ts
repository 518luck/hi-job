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
