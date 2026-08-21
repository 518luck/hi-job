import { useEffect, useState } from 'react';

import { useLatestVersion } from '../hooks/use-latest-version';
import { REPO_URL } from '../lib/site';
import { cn } from '../lib/utils';
import { DownloadButton } from './download-button';

// @ 滚动文字列文案：左列职位卡片，右列沟通动态
const MARQUEE_JOBS = [
  'Java 开发 · 25-40K',
  '前端开发 · React',
  'AI 应用工程师',
  '产品经理 · 电商',
  '数据分析 · 14薪',
  'Go 后端 · 大厂优先',
  '算法工程师 · 大模型',
  'UI 设计师 · 13薪',
  '测试开发 · 25-35K',
  '运维开发 · 云原生',
] as const;

const MARQUEE_EVENTS = [
  '您好，我对该职位很感兴趣',
  'HR 已回复',
  '简历匹配度 92%',
  '打招呼已自动发送',
  '职位已归档',
  '3 条新回复待处理',
  'HR 已自动建档',
  '已屏蔽该公司',
  '期待与您进一步沟通',
  '面试邀约 · 明天 14:00',
] as const;

// Hero 区：涟漪入场 + 光斑网格背景 + 两侧滚动文字列 + 价值主张与下载按钮
export function HeroSection() {
  const { version, failed } = useLatestVersion();
  const [started, setStarted] = useState(false);

  // 挂载后下一帧触发入场动画（让初始隐藏态先绘制一帧）
  useEffect(() => {
    const raf = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className={cn(
        'hero-entry relative isolate flex flex-col items-center py-20 text-center sm:py-28',
        started && 'hero-started',
      )}
    >
      {/* 背景层：环境光斑 + 网格，入场时自焦点圆形涟漪揭示 */}
      <div
        aria-hidden
        className="hero-reveal-layer absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
      >
        <div className="hero-ambient absolute inset-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:3.25rem_3.25rem] [mask-image:radial-gradient(ellipse_72%_58%_at_50%_34%,black_18%,transparent_100%)]" />
      </div>
      {/* 入场涟漪光环 */}
      <div aria-hidden className="hero-ripple-ring" />
      {/* 滚动文字列：左上右下循环，悬停暂停；overlay 整体透传点击，仅跑马灯自身可交互 */}
      <div
        aria-hidden
        className="hero-scroll-container pointer-events-none absolute inset-y-0 left-0 right-0 hidden justify-between lg:flex"
      >
        <HeroMarquee items={MARQUEE_JOBS} />
        <HeroMarquee items={MARQUEE_EVENTS} reverse />
      </div>
      {/* 主内容：入场时上浮 */}
      <div className="hero-content-rise flex flex-col items-center gap-6 lg:px-48">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          更好用的 boss 直聘
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          结合你的目标职位与简历，AI
          快速生成量身定制的打招呼与回复话术，帮你打动
          HR、拿到更多回复，提升求职成功率。浏览过的职位自动记录，沟通中的 HR
          自动建档，不喜欢的公司一键屏蔽，求职过程有条不紊。最终是否发送，始终由你掌控。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border px-3 py-1">免费开源</span>
          <span className="rounded-full border px-3 py-1">数据本地存储</span>
          <span className="rounded-full border px-3 py-1">
            不上传任何服务器
          </span>
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
      </div>
    </section>
  );
}

// 滚动文字列：单份文案重复三遍保证高于显示窗口（否则滚动露白），
// 再整体复制一份循环上移自身一半，实现无缝滚动
function HeroMarquee({
  items,
  reverse = false,
}: {
  items: readonly string[];
  reverse?: boolean;
}) {
  const half = [...items, ...items, ...items];
  const doubled = [...half, ...half];
  return (
    <div className="hero-fade-y pointer-events-auto h-full w-44 overflow-hidden">
      <div
        className={cn(
          'hero-scroll-col flex h-max flex-col',
          reverse && 'hero-scroll-col-reverse',
        )}
      >
        {doubled.map((item, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 静态文案双份拼接整体循环，文案大量重复不能作唯一 key，索引才是稳定身份
            key={`${item}-${index}`}
            className="mb-3 w-fit whitespace-nowrap rounded-md border bg-background/60 px-2.5 py-1 text-left text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
