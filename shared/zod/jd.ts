import { z } from 'zod';

// 职位（JD）数据 schema：内容脚本回包是跨环境传来的无类型数据，收包时用它校验
const selectedJdSchema = z.object({
  title: z.string(),
  salary: z.string(),
  tags: z.array(z.string()),
  recruiter: z.string(),
  description: z.string(),
  address: z.string(),
  url: z.string(),
});

// 从 schema 派生 JD 类型，保持单一事实来源
type SelectedJd = z.infer<typeof selectedJdSchema>;

export type { SelectedJd };
export { selectedJdSchema };
