// # 职位卡片：职位概要 + AI 打招呼生成与结果展示
import { useState } from 'react';

import type { RecordedJd } from '@/infra/storage';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Icons } from '@/shared/ui/icons';
import { Textarea } from '@/shared/ui/textarea';

import { generateGreeting } from '../model/generate-greeting';

// 职位卡片的 props
interface JdCardProps {
  jd: RecordedJd;
}

// 职位卡片：概要信息与 AI 打招呼生成
function JdCard({ jd }: JdCardProps) {
  const [greeting, setGreeting] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  // 生成打招呼内容：失败时就地展示错误文案
  const handleGenerate = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const text = await generateGreeting({ jd });
      setGreeting(text);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成失败');
    } finally {
      setGenerating(false);
    }
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
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span className="truncate">{jd.title}</span>
          <Badge variant="secondary" className="shrink-0">
            {jd.salary}
          </Badge>
        </CardTitle>
        <CardDescription className="truncate">
          {jd.companyName} · {jd.recruiter}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            disabled={generating}
            onClick={() => {
              void handleGenerate();
            }}
          >
            <Icons.aiVendors data-icon="inline-start" />
            <span>{generating ? '生成中…' : 'AI 打招呼'}</span>
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
            <Textarea
              rows={5}
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
