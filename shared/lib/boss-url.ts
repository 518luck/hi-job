// # BOSS 站内链接构造工具
import type { Hr } from '@/shared/zod';

// 构造职位详情跳转链接：路径段即 encryptJobId，securityId 为空时省略参数
const jobUrlOf = (hr: Hr): string => {
  const base = `https://www.zhipin.com/job_detail/${hr.encryptJobId}.html`;
  return hr.securityId === ''
    ? base
    : `${base}?securityId=${encodeURIComponent(hr.securityId)}`;
};

export { jobUrlOf };
