// # 详情页自动打招呼（隔离世界）：hash 标记触发自动点「立即沟通」与「继续沟通」
//
// 侧边栏「去沟通」打开带 #hijob-greet 标记的详情页；本模块检测到标记后先清除再执行，
// 手动浏览与刷新都不会触发。点击即发起真实沟通（发出直聘设置的招呼语），
// 未设招呼语或已沟通过时页面会直接跳转会话，等不到弹窗属正常流程。
// 点击「立即沟通」前写入自动问候标记，聊天页消费后自动发起 AI 问候（开关在工作台）。

import {
  clearAutoGreetMarker,
  markAutoGreetPending,
} from '@/shared/lib/auto-greet-marker';
import { JOB_GREET_HASH } from '@/shared/lib/boss-url';
import { debugLog } from '@/shared/lib/debug-log';
import {
  randomDelay,
  showToast,
  waitForVisible,
} from '@/shared/lib/page-interaction';

// 等待按钮/弹窗的超时：页面加载慢或结构变化时放弃自动流程
const WAIT_TIMEOUT_MS = 8000;

// 打招呼弹窗标题：仅该弹窗的「继续沟通」会被自动点击
const GREET_DIALOG_TITLE = '已向BOSS发送消息';

// 定位可见的「立即沟通」按钮
const locateStartButton = (): HTMLElement | null => {
  const button = document.querySelector<HTMLElement>('.btn-startchat');
  return button !== null && button.offsetWidth > 0 ? button : null;
};

// 定位可见的弹窗容器：隐藏的常驻容器不算
const locateVisibleDialog = (): HTMLElement | null => {
  const dialog = document.querySelector<HTMLElement>('.dialog-container');
  return dialog !== null && dialog.offsetWidth > 0 ? dialog : null;
};

// 自动打招呼主流程：等按钮点击 → 等打招呼弹窗点击「继续沟通」
const runAutoGreet = async (): Promise<void> => {
  const startButton = await waitForVisible({
    locate: locateStartButton,
    timeoutMs: WAIT_TIMEOUT_MS,
  });
  if (startButton === null) {
    debugLog('auto-greet', '未找到「立即沟通」按钮，放弃自动流程');
    showToast({ text: '自动沟通未完成：未找到「立即沟通」按钮' });
    return;
  }
  // 点击前写入自动问候标记：点击后的两种去向（弹窗确认/直接跳转）都会落到聊天页消费
  markAutoGreetPending();
  await randomDelay();
  startButton.click();
  debugLog('auto-greet', '已点击「立即沟通」');

  const dialog = await waitForVisible({
    locate: locateVisibleDialog,
    timeoutMs: WAIT_TIMEOUT_MS,
  });
  // 点击后页面直接跳转会话时脚本上下文销毁，走不到这里；等不到弹窗说明流程异常
  if (dialog === null) {
    debugLog('auto-greet', '点击后未出现弹窗也未跳转，请人工确认');
    showToast({ text: '自动沟通未完成：未检测到弹窗或跳转，请手动确认' });
    clearAutoGreetMarker();
    return;
  }
  // > 双重校验：标题与按钮文案都匹配打招呼弹窗才自动点，上限/验证码等弹窗一律不碰
  const title = dialog.querySelector('h3.title')?.textContent?.trim();
  const confirmButton = dialog.querySelector<HTMLElement>(
    '[ka="dialog_confirm"]',
  );
  if (
    title !== GREET_DIALOG_TITLE ||
    confirmButton === null ||
    confirmButton.textContent?.trim() !== '继续沟通'
  ) {
    debugLog('auto-greet', '出现非打招呼弹窗，不自动处理', title ?? '');
    showToast({ text: '自动沟通已暂停：出现其他弹窗，请手动处理' });
    clearAutoGreetMarker();
    return;
  }
  await randomDelay();
  confirmButton.click();
  debugLog('auto-greet', '已点击「继续沟通」，流程完成');
};

// 启动详情页自动打招呼：仅带 hash 标记的职位详情页触发
const startJdDetailGreet = (): void => {
  if (
    !location.pathname.includes('/job_detail/') ||
    location.hash !== JOB_GREET_HASH
  ) {
    return;
  }
  // 进入流程立即清除标记：手动刷新或复制分享链接不再触发
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  void runAutoGreet();
};

export { startJdDetailGreet };
