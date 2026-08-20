// 简历上传区：折叠面板承载 md/docx 上传解析、Markdown 预览、AI 梳理、重新上传与清空
import { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/shared/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Icons } from '@/shared/ui/icons';

import { useResume } from '../model/use-resume';

// 预览区 Markdown 基础排版：标题/列表/表格等元素的间距与样式
const PREVIEW_CLASSES =
  '[&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_table]:my-1 [&_table]:w-full [&_th]:border [&_th]:px-1 [&_td]:border [&_td]:px-1';

// 简历上传区：标题行可折叠收起预览，操作按钮常驻标题行；发起操作或出错时自动展开
function ResumeUpload() {
  const { resume, loaded, upload, organize, restore, clear } = useResume();
  const [uploading, setUploading] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [error, setError] = useState('');
  // null 表示未手动操作：初始展开态跟随「是否已有简历」——未上传时展开引导，已上传默认收起；
  // 查询就绪前一律收起，避免先按「无简历」渲染成展开再突然收起的闪烁
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? (loaded && resume === undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const resumeContent = resume?.content;

  // Markdown 预览按内容记忆化：上传/梳理/折叠等状态变化不重复解析整份简历
  const preview = useMemo(() => {
    if (resumeContent === undefined) {
      return null;
    }
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumeContent}</ReactMarkdown>
    );
  }, [resumeContent]);

  // 出错即展开：折叠态下失败提示不可见会造成静默失败
  const handleErrorShow = (message: string): void => {
    setOpenOverride(true);
    setError(message);
  };

  // 选择文件后解析入库：先展开面板保证过程可见，成功后保持展开供查看结果（收起由下次加载的默认态接管），失败给出提示
  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    setOpenOverride(true);
    setUploading(true);
    setError('');
    try {
      await upload(file);
    } catch (reason) {
      handleErrorShow(
        reason instanceof Error ? reason.message : '文件解析失败',
      );
    } finally {
      setUploading(false);
    }
  };

  // AI 梳理：后台生成整理版并落库（原件自动备份），失败透出可读提示；保持展开供查看新版本
  const handleOrganize = async (): Promise<void> => {
    setOpenOverride(true);
    setOrganizing(true);
    setError('');
    try {
      await organize();
    } catch (reason) {
      handleErrorShow(reason instanceof Error ? reason.message : 'AI 梳理失败');
    } finally {
      setOrganizing(false);
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpenOverride}
      className="flex flex-col gap-2 rounded-md border border-border p-2"
    >
      <div className="flex items-start justify-between gap-2">
        <CollapsibleTrigger className="group/trigger flex shrink-0 cursor-pointer items-center gap-0.5 rounded-sm px-1 py-0.5 -ml-1 text-xs font-medium whitespace-nowrap outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring/50">
          {/* 箭头随开合旋转：Trigger 挂的是 data-panel-open 属性，时长与缓动对齐面板高度动画 */}
          <Icons.chevronDown className="size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-panel-open/trigger:rotate-180 motion-reduce:transition-none" />
          简历
        </CollapsibleTrigger>
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            aria-label={resume === undefined ? '上传简历' : '重新上传'}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Icons.upload />
          </Button>
          {resume !== undefined && (
            <Button
              variant="outline"
              size="xs"
              disabled={organizing || uploading}
              onClick={() => {
                void handleOrganize();
              }}
            >
              <Icons.aiOrganize data-icon="inline-start" />
              <span>{organizing ? '梳理中…' : 'AI 梳理'}</span>
            </Button>
          )}
          {resume?.originalContent !== undefined && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                void restore();
              }}
            >
              <span>恢复</span>
            </Button>
          )}
          {resume !== undefined && (
            <Button
              variant="destructive"
              size="icon-xs"
              aria-label="删除简历"
              onClick={() => {
                void clear();
              }}
            >
              <Icons.remove />
            </Button>
          )}
        </div>
      </div>
      {/* 隐藏文件输入挂在根级：折叠收起内容后「重新上传」仍可触发选择 */}
      <input
        ref={inputRef}
        type="file"
        accept=".md,.docx"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {/* 外层面板只承载高度关键帧动画（块级布局，子内容不随压扁收缩，测量才准）；flex 排版移入内层包裹 */}
      <CollapsibleContent
        keepMounted
        className="overflow-hidden data-open:animate-hijob-collapse-down data-closed:animate-hijob-collapse-up motion-reduce:animate-none"
      >
        <div className="flex flex-col gap-2">
          {/* 格式提示仅在上传前展示：已有简历时让位给预览 */}
          {resume === undefined && (
            <p className="text-xs text-muted-foreground">
              支持 .md / .docx 格式：md 直接读取，docx 自动转
              Markdown（仅保留文字与表格，图片与复杂排版不保留）
            </p>
          )}
          {uploading && (
            <p className="text-xs text-muted-foreground">解析中…</p>
          )}
          {organizing && (
            <p className="text-xs text-muted-foreground">AI 梳理中…</p>
          )}
          {error !== '' && <p className="text-xs text-destructive">{error}</p>}
          {resume !== undefined && (
            <>
              <p className="text-xs text-muted-foreground">
                {resume.fileName}
                {resume.originalContent !== undefined &&
                  '（已 AI 梳理，原版已备份）'}
              </p>
              <div
                className={`max-h-80 overflow-y-auto rounded-md bg-muted/50 p-2 text-xs ${PREVIEW_CLASSES}`}
              >
                {preview}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ResumeUpload };
