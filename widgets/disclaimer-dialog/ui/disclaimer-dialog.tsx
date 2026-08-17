// # 首次启动免责声明弹窗：未确认时阻塞展示，倒计时归零才可确认
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

import { DISCLAIMER_PARAGRAPHS } from '../config/disclaimer-text';
import { useDisclaimer } from '../model/use-disclaimer';

// 首次启动免责声明弹窗：确认后落库，后续打开不再弹出
function DisclaimerDialog() {
  const { visible, seconds, accept } = useDisclaimer();

  if (!visible) {
    return null;
  }
  return (
    // 完全受控并显式否决关闭请求：确认前 Esc/点遮罩均无法关闭
    <AlertDialog open onOpenChange={(_, details) => details.cancel()}>
      <AlertDialogContent>
        {/* 不用 Header 的居中 grid（窄视口会把正文宽度收窄造成右侧留白），改为全宽左对齐容器 */}
        <div className="flex w-full flex-col gap-2 text-left">
          <AlertDialogTitle>免责声明</AlertDialogTitle>
          {/* description 默认渲染 p，内嵌段落需改渲染为 div，避免 p 嵌套 p 的非法结构 */}
          <AlertDialogDescription
            render={<div />}
            className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            {DISCLAIMER_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <Button
            disabled={seconds > 0}
            onClick={() => {
              // 写库失败保持弹窗，等待用户重试
              void accept().catch(() => {});
            }}
          >
            {seconds > 0 ? `我已阅读并同意（${seconds} 秒）` : '我已阅读并同意'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DisclaimerDialog };
