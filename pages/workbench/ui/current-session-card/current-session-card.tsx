// # 当前会话卡片：按当前页面类型切换 HR 会话卡与公司信息卡
import { usePageJobContext } from '../../model/use-page-job-context';
import { CompanyContextCard } from './company-context-card';
import { HrSessionCard } from './hr-session-card';

// 当前会话卡片：职位列表页显示公司信息卡，其他页面显示 HR 会话卡
function CurrentSessionCard() {
  const { context } = usePageJobContext();
  if (
    context?.page === 'jobs' &&
    context.job !== undefined &&
    context.job.brandName !== ''
  ) {
    return <CompanyContextCard job={context.job} />;
  }
  return <HrSessionCard />;
}

export { CurrentSessionCard };
