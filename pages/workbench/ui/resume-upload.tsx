// 简历上传区：md/docx 上传解析、Markdown 渲染预览、重新上传与清空
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';

import { useResume } from '../model/use-resume';

// 预览区 Markdown 基础排版：标题/列表/表格等元素的间距与样式
const PREVIEW_CLASSES =
  '[&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_table]:my-1 [&_table]:w-full [&_th]:border [&_th]:px-1 [&_td]:border [&_td]:px-1';

// 简历上传区：未上传显示上传按钮，已上传显示渲染预览与操作
function ResumeUpload() {
  const { resume, upload, clear } = useResume();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 选择文件后解析入库；解析失败时给出可读提示
  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    setUploading(true);
    setError('');
    try {
      await upload(file);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '文件解析失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">简历</p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Icons.upload data-icon="inline-start" />
            <span>{resume === undefined ? '上传简历' : '重新上传'}</span>
          </Button>
          {resume !== undefined && (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => {
                void clear();
              }}
            >
              <span>删除</span>
            </Button>
          )}
        </div>
      </div>
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
      {/* 格式提示仅在上传前展示：已有简历时让位给预览 */}
      {resume === undefined && (
        <p className="text-xs text-muted-foreground">
          支持 .md / .docx 格式：md 直接读取，docx 自动转
          Markdown（仅保留文字与表格，图片与复杂排版不保留）
        </p>
      )}
      {uploading && <p className="text-xs text-muted-foreground">解析中…</p>}
      {error !== '' && <p className="text-xs text-destructive">{error}</p>}
      {resume !== undefined && (
        <>
          <p className="text-xs text-muted-foreground">{resume.fileName}</p>
          <div
            className={`max-h-80 overflow-y-auto rounded-md bg-muted/50 p-2 text-xs ${PREVIEW_CLASSES}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resume.content}
            </ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}

export { ResumeUpload };
