// # 职位列表页：最近记录的职位与 AI 打招呼
import { useJds } from '../model/use-jds';
import { JdCard } from './jd-card';

// 职位列表页：卡片流展示最近记录的职位
function JobsPage() {
  const { jds, loading } = useJds();

  // 渲染职位列表：读取中与空态提示
  const renderList = () => {
    if (loading) {
      return <p className="text-xs text-muted-foreground">读取中…</p>;
    }
    if (jds.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有记录的职位：在招聘网站打开职位详情自动记录
        </p>
      );
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
      <h2 className="text-base font-medium">职位</h2>
      {renderList()}
    </div>
  );
}

export { JobsPage };
