// # BOSS 站内链接构造工具

// 职位详情链接所需的最小标识：Hr 与 VueJobData 均结构满足
interface JobUrlSource {
  encryptJobId: string; // 职位加密 id，详情页路径段
  securityId: string; // 会话安全 id，为空串时省略参数
}

// 去沟通 hash 标记：侧边栏「去沟通」与详情页自动打招呼模块之间的触发协议
const JOB_GREET_HASH = '#hijob-greet';

// 构造职位详情跳转链接：路径段即 encryptJobId，securityId 为空时省略参数
const jobUrlOf = ({ encryptJobId, securityId }: JobUrlSource): string => {
  const base = `https://www.zhipin.com/job_detail/${encryptJobId}.html`;
  return securityId === ''
    ? base
    : `${base}?securityId=${encodeURIComponent(securityId)}`;
};

export { JOB_GREET_HASH, jobUrlOf };
