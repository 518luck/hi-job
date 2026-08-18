import { Download } from 'lucide-react';

import { DOWNLOAD_URL } from '../lib/site';
import { cn } from '../lib/utils';

// 下载主按钮：指向永远最新的 Release 固定直链
export function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  return (
    <a
      href={DOWNLOAD_URL}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-85',
        size === 'lg' ? 'h-12 px-8 text-base' : 'h-9 px-4 text-sm',
      )}
    >
      <Download className="size-4" aria-hidden />
      下载 Chrome 版（zip）
    </a>
  );
}
