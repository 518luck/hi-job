// # 简历文件解析：md 直读，docx 经 mammoth 转 HTML 再 turndown 转 Markdown
import mammoth from 'mammoth';
import TurndownService from 'turndown';

// HTML 转 Markdown 服务实例：atx 标题、fenced 代码块
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// 解析结果：文件名与 Markdown 文本
interface ParsedResume {
  fileName: string;
  content: string;
}

// 支持的文本扩展名：直读为 Markdown
const TEXT_EXTENSIONS = ['md', 'markdown', 'txt'];

// 解析 md/txt 文件：直接读文本
const parseMarkdownFile = async (file: File): Promise<string> => file.text();

// 解析 docx 文件：mammoth 转 HTML 后 turndown 转 Markdown
const parseDocxFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return turndown.turndown(result.value);
};

// 按扩展名解析简历文件：仅支持 md/markdown/txt 与 docx，其余抛错
const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  let content: string;
  if (extension === 'docx') {
    content = await parseDocxFile(file);
  } else if (TEXT_EXTENSIONS.includes(extension)) {
    content = await parseMarkdownFile(file);
  } else {
    throw new Error('仅支持 .md / .docx 格式的简历文件');
  }
  return { fileName, content };
};

export { parseResumeFile };
