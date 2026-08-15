import { useEffect, useState } from 'react';
import type { CompanyRecord, RecordedJd } from '@/shared/zod/jd';
import { readAllCompanyRecords, readAllRecordedJds, watchStore } from './jd-store';

// 收藏页列表数据：挂载时全量读取，存储变化时自动刷新
const useRecordedJds = (): {
  jds: RecordedJd[];
  companies: CompanyRecord[];
  loading: boolean;
} => {
  const [jds, setJds] = useState<RecordedJd[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 全量读取职位与公司记录
    const refresh = async () => {
      const [nextJds, nextCompanies] = await Promise.all([
        readAllRecordedJds(),
        readAllCompanyRecords(),
      ]);
      setJds(nextJds);
      setCompanies(nextCompanies);
      setLoading(false);
    };
    refresh();
    const unwatch = watchStore(() => {
      refresh();
    });
    return () => {
      unwatch();
    };
  }, []);

  return { jds, companies, loading };
};

export { useRecordedJds };
