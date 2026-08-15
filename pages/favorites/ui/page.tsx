import type { ReactElement } from 'react';
import { useState } from 'react';

import { Icons } from '@/shared/ui/icons';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { useRecordedJds } from '../model/use-recorded-jds';
import { CompanyList } from './company-list';
import { JdCard } from './jd-card';

// 记录列表的展示视图：按公司聚合或按时间倒序
type ListView = 'company' | 'timeline';

// 判断值是否为合法列表视图
const isListView = (value: string): value is ListView =>
  value === 'company' || value === 'timeline';

// 收藏页：自动记录点击过的职位，按公司聚合或时间流展示
function FavoritesPage() {
  const [view, setView] = useState<ListView>('company');
  const { jds, companies, loading } = useRecordedJds();

  // 渲染记录列表：读取中、空态与两种视图
  const renderList = (): ReactElement | null => {
    if (loading) {
      return <p className="text-xs text-muted-foreground">读取中…</p>;
    }
    if (jds.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有记录：在 Boss直聘 页面点开职位，这里会自动出现
        </p>
      );
    }
    if (view === 'company') {
      return <CompanyList companies={companies} jds={jds} />;
    }
    return (
      <div className="flex flex-col gap-2">
        {jds.map((jd) => (
          <JdCard key={jd.jobId} jd={jd} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">收藏</h2>
      <p className="text-xs text-muted-foreground">
        已记录 {jds.length} 条职位 · {companies.length} 家公司
      </p>
      <ToggleGroup
        variant="outline"
        className="w-full"
        value={[view]}
        onValueChange={(values) => {
          const next = values[0];
          if (next !== undefined && isListView(next)) {
            setView(next);
          }
        }}
      >
        <ToggleGroupItem value="company" className="flex-1">
          <Icons.company data-icon="inline-start" />
          <span>按公司</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="timeline" className="flex-1">
          <Icons.history data-icon="inline-start" />
          <span>按时间</span>
        </ToggleGroupItem>
      </ToggleGroup>
      {renderList()}
    </div>
  );
}

export { FavoritesPage };
