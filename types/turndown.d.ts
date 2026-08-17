// turndown 库类型声明：npm 无 @types，声明本项目用到的 API
declare module 'turndown' {
  // HTML 转 Markdown 服务：本项目仅用默认配置的 turndown 方法
  export default class TurndownService {
    constructor(options?: {
      headingStyle?: 'setext' | 'atx';
      codeBlockStyle?: 'indented' | 'fenced';
    });
    turndown(html: string): string;
  }
}
