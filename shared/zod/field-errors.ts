// # zod 校验错误提取：按字段名取每个字段的第一条错误信息
import type { ZodError } from 'zod';

// 把 ZodError 压平成「字段名 → 首条错误文案」映射，供表单逐字段展示
const fieldErrorsOf = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
};

export { fieldErrorsOf };
