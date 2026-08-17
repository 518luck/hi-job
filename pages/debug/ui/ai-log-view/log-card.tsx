// # 单条 AI 日志卡片：手风琴触发头展示摘要，展开后各详情字段独立折叠
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import type { AiLog } from '@/shared/zod';

import { SOURCE_LABELS, THINKING_MODE_LABELS } from '../../config/log-labels';
import { formatLogTime } from '../../model/log-format';

// 可折叠详情字段：内层手风琴项，触发头为字段名，展开后展示等宽文本
function DetailField({
  value,
  label,
  text,
}: {
  value: string;
  label: string;
  text: string;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="px-2 py-1.5">{label}</AccordionTrigger>
      {/* 嵌套手风琴跳过高度动画：内容区固定等高，长文本内部滚动，不沿用外层面板的高度变量 */}
      <AccordionContent disableAnimation className="[&>div]:h-auto">
        <pre className="h-48 overflow-x-auto overflow-y-auto p-2 text-xs break-all whitespace-pre-wrap">
          {text}
        </pre>
      </AccordionContent>
    </AccordionItem>
  );
}

// 单条 AI 日志手风琴项目：展开区按字段有无展示提示词、职位与错误详情
function LogCard({ log }: { log: AiLog }) {
  return (
    <AccordionItem value={String(log.id)} className="rounded-lg border">
      <AccordionTrigger className="flex-col items-start gap-1 px-2 py-2 hover:no-underline">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatLogTime(log.createdAt)}
          </span>
          <Badge
            variant={log.ok ? 'outline' : 'destructive'}
            className={
              log.ok
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                : undefined
            }
          >
            {log.ok ? '成功' : '失败'}
          </Badge>
        </div>
        <div className="flex w-full items-center gap-1 text-xs">
          <span>{SOURCE_LABELS[log.source]}</span>
          <span className="text-muted-foreground">·</span>
          <span className="truncate">{log.vendorName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="truncate">{log.modelId}</span>
        </div>
        <div className="w-full text-xs text-muted-foreground">
          思考：{THINKING_MODE_LABELS[log.thinkingMode]} · 耗时 {log.durationMs}
          ms
        </div>
        {log.jd !== undefined && (
          <div className="w-full text-xs">
            <span className="truncate">{log.jd.title}</span>
            <span className="text-muted-foreground">
              {' '}
              · {log.jd.companyName}
            </span>
            {log.jd.salary !== '' && (
              <span className="text-primary"> · {log.jd.salary}</span>
            )}
          </div>
        )}
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-1 border-t px-2 pt-2">
        <Accordion className="flex flex-col gap-1">
          {log.system !== undefined && log.system !== '' && (
            <DetailField value="system" label="系统提示词" text={log.system} />
          )}
          {log.prompt !== undefined && log.prompt !== '' && (
            <DetailField value="prompt" label="用户提示词" text={log.prompt} />
          )}
          {log.promptTask !== undefined && log.promptTask !== '' && (
            <DetailField
              value="promptTask"
              label="任务描述"
              text={log.promptTask}
            />
          )}
          {log.promptRequirement !== undefined &&
            log.promptRequirement !== '' && (
              <DetailField
                value="promptRequirement"
                label="生成要求"
                text={log.promptRequirement}
              />
            )}
          {log.resume !== undefined && (
            <DetailField value="resume" label="简历" text={log.resume} />
          )}
          {log.jd !== undefined && (
            <DetailField
              value="jd"
              label="职位信息"
              text={JSON.stringify(log.jd, null, 2)}
            />
          )}
          <DetailField
            value="resolvedArgs"
            label="实际传递参数"
            text={JSON.stringify(log.resolvedArgs, null, 2)}
          />
          {log.output !== undefined && log.output !== '' && (
            <DetailField value="output" label="AI 回复" text={log.output} />
          )}
        </Accordion>
        {log.error !== undefined && (
          <p className="text-xs break-all text-destructive">{log.error}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export { LogCard };
