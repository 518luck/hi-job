import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

// 单张截图：图片缺失时（onError）显示虚线占位框，放入真实截图后自动替换
function ScreenshotFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  const [missing, setMissing] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        {missing ? (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden />
            <span className="text-sm">截图待补充：{caption}</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="aspect-[3/4] w-full object-cover object-top"
            onError={() => setMissing(true)}
          />
        )}
      </div>
      <figcaption className="text-center text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

// 截图区：工作台 / 聊天页 / 记录页三张界面图
export function ScreenshotSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        界面一览
      </h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <ScreenshotFigure
          src="screenshots/workbench.png"
          alt="侧边栏工作台"
          caption="工作台"
        />
        <ScreenshotFigure
          src="screenshots/chat.png"
          alt="聊天页与 HR 档案"
          caption="聊天页"
        />
        <ScreenshotFigure
          src="screenshots/records.png"
          alt="职位记录页"
          caption="记录页"
        />
      </div>
    </section>
  );
}
