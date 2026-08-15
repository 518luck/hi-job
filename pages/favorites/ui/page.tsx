import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import type { SelectedJd } from '@/shared/zod/jd';
import { selectedJdSchema } from '@/shared/zod/jd';
import { GET_SELECTED_JD } from '../config/constants';
import { JdCard } from './jd-card';

// > 向当前标签页的内容脚本请求选中的 JD；回包是跨环境无类型数据，经 zod 校验后才使用
const fetchSelectedJd = async (): Promise<SelectedJd | null> => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (activeTab?.id === undefined) {
    return null;
  }
  const response = await browser.tabs.sendMessage(activeTab.id, {
    type: GET_SELECTED_JD,
  });
  const parsed = selectedJdSchema.safeParse(response);
  return parsed.success ? parsed.data : null;
};

// 收藏页：抓取并展示 Boss直聘 当前选中的 JD
function FavoritesPage() {
  const [jd, setJd] = useState<SelectedJd | null>(null);
  const [error, setError] = useState('');

  // 抓取成功写入结果；未选中或请求失败时展示对应错误提示
  const handleFetch = async () => {
    try {
      const result = await fetchSelectedJd();
      if (result === null || result.title === '') {
        setError('没有检测到选中的职位，请先在 Boss直聘 页面点开一个职位');
        return;
      }
      setJd(result);
      setError('');
    } catch {
      setError(
        '获取失败：当前标签页不是 Boss直聘，或页面需要刷新一次让脚本注入',
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">收藏</h2>
      <Button type="button" onClick={() => handleFetch()}>
        <Icons.favorites data-icon="inline-start" />
        抓取当前职位
      </Button>
      {error !== '' && <p className="text-xs text-destructive">{error}</p>}
      {jd !== null && <JdCard jd={jd} />}
    </div>
  );
}

export { FavoritesPage };
