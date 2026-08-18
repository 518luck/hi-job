import { TriangleAlert } from 'lucide-react';

import { DownloadButton } from './download-button';

// 安装五步：zip 侧载流程，面向无开发背景用户
const STEPS: readonly string[] = [
  '点击下载按钮，得到 hi-job-chrome.zip，解压到一个不会删除的目录（例如「文档」下新建 hi-job 文件夹）',
  '打开 Chrome，地址栏输入 chrome://extensions/ 回车',
  '打开页面右上角的「开发者模式」开关',
  '点击「加载已解压的扩展程序」，选择解压出来的文件夹（选内含 manifest.json 的那一层）',
  '工具栏出现扩展图标，点开侧边栏即可使用',
];

// 安装教程区：步骤列表 + 更新说明
export function InstallSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        安装与更新
      </h2>
      <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6 sm:p-8">
        <ol className="mb-8 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex justify-center">
          <DownloadButton />
        </div>
        <p className="mt-6 rounded-lg bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
          更新方式：有新版本时重新下载 zip 并解压，到 chrome://extensions/
          再次点击「加载已解压的扩展程序」选择新目录即可——扩展 ID
          已固定，会在原条目上原地更新，职位记录、HR
          档案等数据不会丢失；旧目录确认新版可用后可删除。解压后的目录别删别挪，扩展需要持续读取它。
        </p>
        {/* // ! 更新注意事项：误点移除或先删旧目录都会丢数据，与上方流程说明区分警示等级 */}
        <div
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          role="note"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            更新注意事项
          </div>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li>
              不要点扩展卡片上的「移除」按钮——删除会连同职位记录、HR
              档案等全部本地数据一起清除，且不可恢复。
            </li>
            <li>
              新版本加载成功并确认可用之前，不要删除旧的解压文件夹；顺序永远是：加载新版
              → 确认能用 → 再删旧文件夹。
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
