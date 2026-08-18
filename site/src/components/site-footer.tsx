import { ISSUES_URL, REPO_URL } from '../lib/site';

// 页脚：仓库入口、反馈、合规声明
export function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 border-t py-8 text-center text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub 仓库
        </a>
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          问题反馈
        </a>
      </div>
      <p>本扩展与 BOSS直聘无任何关联，仅供个人学习与技术交流使用。</p>
      <p>数据全部本地存储，绝不上传。</p>
    </footer>
  );
}
