// # 单条 AI 日志卡片：手风琴触发头展示摘要，展开后展示原生提示词对象与结果详情
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

// 由上下文段标题推断字段名，并兼容历史日志的旧标题格式
const sectionLabelOf = (section: string): string => {
  if (section.startsWith('## 聊天记录') || section.startsWith('聊天记录')) {
    return '聊天记录';
  }
  if (section.startsWith('已发送')) {
    return '打招呼语';
  }
  return '上下文片段';
};

// 单条 AI 日志手风琴项目：触发头带职位摘要，展开区展示提示词素材与结果详情
function LogCard({ log }: { log: AiLog }) {
  const prompt = log.prompt;
  const promptText = log.promptText;
  const jd = prompt?.jd;
  return (
    <AccordionItem value={String(log.id)} className="rounded-lg border">
      <AccordionTrigger className="flex-col items-start gap-1 px-2 py-2 hover:no-underline">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {formatLogTime(log.createdAt)}
          </span>
          <Badge
            variant={log.ok ? 'outline' : 'destructive'}
            className={
              log.ok
                ? 'shrink-0 border-emerald-200 bg-emerald-100 text-emerald-700'
                : 'shrink-0'
            }
          >
            {log.ok ? '成功' : '失败'}
          </Badge>
        </div>
        <div className="w-full text-xs">{SOURCE_LABELS[log.source]}</div>
        <div className="w-full truncate text-xs">
          {log.vendorName} · {log.modelId}
        </div>
        <div className="w-full text-xs text-muted-foreground">
          思考：{THINKING_MODE_LABELS[log.thinkingMode]} · 耗时 {log.durationMs}
          ms
        </div>
        {jd !== undefined && (
          <>
            <div className="w-full truncate text-xs">{jd.title}</div>
            <div className="flex w-full items-center gap-1 text-xs">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {jd.companyName}
              </span>
              {jd.salary !== '' && (
                <span className="shrink-0 text-primary whitespace-nowrap">
                  {jd.salary}
                </span>
              )}
            </div>
          </>
        )}
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-1 border-t px-2 pt-2">
        <Accordion className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            系统提示词
          </span>
          {log.system !== undefined && log.system !== '' && (
            <DetailField value="system" label="角色描述" text={log.system} />
          )}
          {prompt !== undefined && (
            <>
              <span className="text-xs font-medium text-muted-foreground">
                用户提示词
              </span>
              {promptText !== undefined && promptText !== '' && (
                <DetailField
                  value="promptText"
                  label="用户提示词全文"
                  text={promptText}
                />
              )}
              <DetailField value="task" label="任务描述" text={prompt.task} />
              <DetailField
                value="requirement"
                label="生成要求"
                text={prompt.requirement}
              />
              <DetailField
                value="jd"
                label="职位详情"
                text={JSON.stringify(prompt.jd, null, 2)}
              />
              {prompt.hr !== undefined && (
                <DetailField
                  value="hr"
                  label="当前 HR 信息"
                  text={JSON.stringify(prompt.hr, null, 2)}
                />
              )}
              {prompt.resumeText !== undefined && prompt.resumeText !== '' && (
                <DetailField
                  value="resumeText"
                  label="求职者简历"
                  text={prompt.resumeText}
                />
              )}
              {(prompt.sections ?? []).map((section) => (
                <DetailField
                  key={section}
                  value={section}
                  label={sectionLabelOf(section)}
                  text={section}
                />
              ))}
            </>
          )}
          <DetailField
            value="resolvedArgs"
            label="模型思考等级参数"
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
