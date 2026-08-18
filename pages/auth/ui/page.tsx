// # AI 厂商授权页：独立小窗内一键申请厂商地址的跨域访问权限
import { useState } from 'react';

import { Button } from '@/shared/ui/button';

// 授权页的 props
interface AuthPageProps {
  origin: string; // 待授权的厂商接口地址（origin 形态），空串表示缺少参数
}

// 授权状态：待授权 / 已授权 / 已拒绝
type AuthState = 'idle' | 'granted' | 'denied';

// AI 厂商授权页：点击按钮在扩展页面内完成手势授权，成功后自动关窗
function AuthPage({ origin }: AuthPageProps) {
  const [state, setState] = useState<AuthState>('idle');

  // 申请权限：Chrome 系统弹窗确认，拒绝或失败可重试
  const requestAuth = async (): Promise<void> => {
    const granted = await browser.permissions
      .request({ origins: [`${origin}/*`] })
      .catch(() => false);
    if (granted) {
      setState('granted');
      setTimeout(() => window.close(), 800);
      return;
    }
    setState('denied');
  };

  if (origin === '') {
    return (
      <p className="p-4 text-sm leading-relaxed text-muted-foreground">
        缺少授权地址参数：请从聊天窗报错里的「去授权」按钮进入本页
      </p>
    );
  }

  // 按钮文案随状态切换
  const buttonLabel =
    state === 'granted'
      ? '已授权，窗口即将关闭'
      : state === 'denied'
        ? '已拒绝，点击重试'
        : '授权访问';

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-base font-medium">授权访问 AI 厂商</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        生成回复需要访问下方厂商地址，点击后 Chrome 会弹出确认框：
      </p>
      <code className="max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-xs">
        {origin}
      </code>
      <Button
        className="mt-2"
        disabled={state === 'granted'}
        onClick={() => {
          void requestAuth();
        }}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export { AuthPage };
