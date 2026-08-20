// # 简历外补充卡片：折叠录入简历之外的浅层经历，作为 AI 聊天的个性化素材
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Icons } from '@/shared/ui/icons';
import { Textarea } from '@/shared/ui/textarea';

import { useResumeSupplement } from '../model/use-resume-supplement';

// 字数上限：与 zod schema 的 max(2000) 构成双重限制
const CONTENT_LIMIT = 2000;

// 简历外补充卡片：默认收起，展开后受控编辑 textarea，失焦且内容变化时才写库
function ResumeSupplementCard() {
  const { supplement, saveSupplement } = useResumeSupplement();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasContent = value.trim() !== '';

  // 初次装载：用库中已有内容初始化编辑值；此后不再跟随 store 回写，避免覆盖编辑中的草稿
  useEffect(() => {
    if (!hydrated && supplement !== undefined) {
      setValue(supplement.content);
      setHydrated(true);
    }
  }, [supplement, hydrated]);

  // 失焦保存：击键只改本地态，仅在内容相对库中值变化时写库，避免每次击键落库
  const handleBlur = async (): Promise<void> => {
    if (value === (supplement?.content ?? '')) {
      return;
    }
    await saveSupplement(value);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col gap-1"
    >
      <CollapsibleTrigger className="group/trigger flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring/50">
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            简历外补充
          </span>
          {/* 状态方灯：有内容亮主色，空置淡灰，收起时也能读出录入状态 */}
          <span
            aria-hidden
            className={cn(
              'size-1.5 rounded-[2px] transition-colors',
              hasContent ? 'bg-primary' : 'bg-muted-foreground/20',
            )}
          />
        </span>
        <Icons.chevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-panel-open/trigger:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      {/* 动画外壳用无边框面板包裹带边框卡片：收起时卡片被完全裁掉，不留边框残影 */}
      <CollapsibleContent className="overflow-hidden data-open:animate-hijob-collapse-down data-closed:animate-hijob-collapse-up motion-reduce:animate-none">
        <div className="divide-y divide-border rounded-md border border-border">
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              不会出现在简历里，仅供 AI 聊天时自然提及
            </p>
            {/* 固定高度并关闭 field-sizing：高度不随内容变化，保证折叠动画测量稳定 */}
            <Textarea
              value={value}
              maxLength={CONTENT_LIMIT}
              placeholder="记录简历之外的小项目、技能涉猎等浅层经历…"
              className="field-sizing-fixed h-40 resize-none overflow-y-auto"
              onChange={(event) => {
                setValue(event.target.value);
              }}
              onBlur={() => {
                void handleBlur();
              }}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {value.length}/{CONTENT_LIMIT}
            </span>
            {/* 保存反馈：常驻占位 + 透明度过渡，保存成功亮起约 1.5s 后淡出 */}
            <span
              className={cn(
                'text-xs text-muted-foreground transition-opacity duration-300 motion-reduce:transition-none',
                saved ? 'opacity-100' : 'opacity-0',
              )}
            >
              已保存
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ResumeSupplementCard };
