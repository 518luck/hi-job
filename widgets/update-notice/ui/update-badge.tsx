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
