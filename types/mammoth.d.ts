// mammoth 库类型声明：npm 无 @types，声明本项目用到的 API
declare module 'mammoth' {
  // 转换结果：value 为输出文本，messages 为转换告警
  interface MammothResult {
    value: string;
    messages: unknown[];
  }

  // 浏览器端从 ArrayBuffer 转换 docx 为 HTML
  export function convertToHtml(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<MammothResult>;
}
