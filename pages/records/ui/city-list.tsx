import { useState } from 'react';

import type { RecordedJd } from '@/shared/infra/storage';
import { cn } from '@/shared/lib/cn';
import { Icons } from '@/shared/ui/icons';

import { extractCity } from '../model/extract-city';
import { JdCard } from './jd-card';

// 地区列表的 props
interface CityListProps {
  jds: RecordedJd[];
}

// 地址无法识别城市时的兜底分组名
const UNKNOWN_CITY = '未知地区';

// 按城市聚合职位：职位多的城市在前，未知地区沉底
const groupByCity = (
  jds: RecordedJd[],
): Array<{ city: string; cityJds: RecordedJd[] }> => {
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

// 地区聚合列表：按城市分组展示职位，点击展开该城市的职位卡片
function CityList({ jds }: CityListProps) {
  const [openCity, setOpenCity] = useState('');
  const groups = groupByCity(jds);

  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        还没有记录职位：在 Boss直聘 页面点开职位，这里会自动出现
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {groups.map(({ city, cityJds }) => {
        const isOpen = openCity === city;
        return (
          <div key={city} className="flex flex-col">
            <button
              type="button"
              className="flex items-center gap-2 border-b border-border px-1 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setOpenCity(isOpen ? '' : city);
              }}
            >
              <Icons.chevronDown
                data-icon="inline-start"
                className={cn(
                  'size-3.5 shrink-0 text-muted-foreground transition-transform',
                  isOpen ? '' : '-rotate-90',
                )}
              />
              <span className="min-w-0 flex-1 truncate">{city}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {cityJds.length} 个职位
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-2 py-2 pl-2">
                {cityJds.map((jd) => (
                  <JdCard key={jd.jobId} jd={jd} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { CityList };
