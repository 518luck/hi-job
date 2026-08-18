import { useLatestVersion } from '../hooks/use-latest-version';
import { REPO_URL } from '../lib/site';
import { DownloadButton } from './download-button';

// Hero 区：价值主张 + 下载主按钮 + 版本号与徽章
export function HeroSection() {
  const { version, failed } = useLatestVersion();

  return (
    <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        更好用的 boss 直聘
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        结合你的目标职位与简历，AI 快速生成量身定制的打招呼与回复话术，帮你打动
        HR、拿到更多回复，提升求职成功率。浏览过的职位自动记录，沟通中的 HR
        自动建档，不喜欢的公司一键屏蔽，求职过程有条不紊。最终是否发送，始终由你掌控。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="rounded-full border px-3 py-1">免费开源</span>
        <span className="rounded-full border px-3 py-1">数据本地存储</span>
        <span className="rounded-full border px-3 py-1">不上传任何服务器</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <DownloadButton />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center rounded-lg border px-8 text-base font-medium transition-colors hover:bg-accent"
        >
          查看源码
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        {failed
          ? '最新版本见 GitHub Releases'
          : version
            ? `当前版本 ${version}`
            : '正在获取版本…'}
        <span className="mx-2">·</span>
        下载不畅可稍后重试
      </p>
    </section>
  );
}
