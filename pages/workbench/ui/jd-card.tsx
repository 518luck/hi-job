// # 职位卡片：职位概要 + AI 打招呼生成与结果展示
import { useState } from 'react';

import { generateGreeting } from '@/shared/infra/ai';
import type { AiVendorRecord, RecordedJd } from '@/shared/infra/storage';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Icons } from '@/shared/ui/icons';
import { Textarea } from '@/shared/ui/textarea';

// 职位卡片的 props：vendor/modelId 为页面所选的生成配置，未配置厂商时为 undefined
interface JdCardProps {
  jd: RecordedJd;
  vendor?: AiVendorRecord;
  modelId?: string;
}

// 职位卡片：概要信息与 AI 打招呼生成
function JdCard({ jd, vendor, modelId }: JdCardProps) {
  const [greeting, setGreeting] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  // 核心生成：按当前 JD 生成打招呼文本并展示，未配置厂商或失败时写入提示
  const generate = async (): Promise<string> => {
    if (vendor === undefined || modelId === undefined) {
      setMessage('还没有配置 AI 厂商：去「AI 厂商」页添加');
      return '';
    }
    setGenerating(true);
    setMessage('');
    try {
      const text = await generateGreeting({ jd, vendor, modelId });
      setGreeting(text);
      return text;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成失败');
      return '';
    } finally {
      setGenerating(false);
    }
  };

  // 生成问候：按当前 JD 生成打招呼文本，供查看与编辑
  const handleGenerateOnly = async () => {
    await generate();
  };

  // 复制打招呼内容到剪贴板，短暂切换按钮文案
  const handleCopy = async () => {
    await navigator.clipboard.writeText(greeting);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{jd.title}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <Badge variant="secondary">{jd.salary}</Badge>
          {jd.recruiterActive ? (
            <Badge variant="outline">
              <span className="size-1.5 rounded-full bg-primary" />
              {jd.recruiterActive}
            </Badge>
          ) : null}
        </CardAction>
        <CardDescription className="line-clamp-2">
          {[
            jd.companyScale,
            jd.companyIndustry,
            jd.recruiter === '' ? jd.companyName : jd.recruiter,
          ]
            .filter(Boolean)
            .join(' · ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex justify-end gap-1">
          {jd.url !== '' && (
            <Button
              variant="ghost"
              size="icon-xs"
              title="打开职位详情页"
              aria-label="打开职位详情页"
              onClick={() => {
                void browser.tabs.create({ url: jd.url });
              }}
            >
              <Icons.externalLink />
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            disabled={generating}
            onClick={() => {
              void handleGenerateOnly();
            }}
          >
            <Icons.refresh data-icon="inline-start" />
            <span>{generating ? '生成中…' : '生成问候'}</span>
          </Button>
        </div>
        {message !== '' && (
          <p className="text-xs text-destructive">{message}</p>
        )}
        {greeting !== '' && (
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                打招呼内容（可编辑）
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={generating}
                  title="重新生成"
                  aria-label="重新生成"
                  onClick={() => {
                    void handleGenerateOnly();
                  }}
                >
                  <Icons.refresh
                    className={generating ? 'animate-spin' : undefined}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    void handleCopy();
                  }}
                >
                  <Icons.copy data-icon="inline-start" />
                  <span>{copied ? '已复制' : '复制'}</span>
                </Button>
              </div>
            </div>
            <Textarea
              rows={5}
              className="max-h-60 overflow-y-auto"
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { JdCard };
