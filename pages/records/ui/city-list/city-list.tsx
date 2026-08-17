import { useMemo } from 'react';

import type { RecordedJd } from '@/shared/zod';

import { extractCity } from '../../model/extract-city';
import { DataTable } from '../data-table';
import { type CityGroup, cityColumns } from './columns';

// 地区列表的 props
interface CityListProps {
  jds: RecordedJd[];
}

// 地址无法识别城市时的兜底分组名
const UNKNOWN_CITY = '未知地区';

// 按城市聚合职位：职位多的城市在前，未知地区沉底
const groupByCity = (jds: RecordedJd[]): CityGroup[] => {
  const cityMap = new Map<string, RecordedJd[]>();
  for (const jd of jds) {
    const city = extractCity(jd.address) || UNKNOWN_CITY;
    const group = cityMap.get(city);
    if (group === undefined) {
      cityMap.set(city, [jd]);
    } else {
      group.push(jd);
    }
  }
  return [...cityMap.entries()]
    .map(([city, cityJds]) => ({ city, cityJds }))
    .sort((a, b) => {
      const aUnknown = a.city === UNKNOWN_CITY ? 1 : 0;
      const bUnknown = b.city === UNKNOWN_CITY ? 1 : 0;
      return aUnknown - bUnknown || b.cityJds.length - a.cityJds.length;
    });
};

// 地区列表：按城市聚合职位数，表格虚拟滚动展示
function CityList({ jds }: CityListProps) {
  const groups = useMemo(() => groupByCity(jds), [jds]);

  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有记录职位：在 Boss直聘 页面点开职位，这里会自动出现
      </p>
    );
  }
  return (
    <DataTable columns={cityColumns} data={groups} estimateSize={() => 36} />
  );
}

export { CityList };
