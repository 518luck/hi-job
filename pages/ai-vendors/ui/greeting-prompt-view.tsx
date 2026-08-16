// # 提示词配置视图：编辑打招呼的任务描述与生成要求，保存到全局偏好

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import {
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_TASK,
} from '@/shared/infra/ai';
import {
  aiPreferenceStore,
  DEFAULT_AI_PREFERENCE,
} from '@/shared/infra/storage';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import { Textarea } from '@/shared/ui/textarea';

// 提示词配置视图的 props：onBack 返回厂商列表
interface GreetingPromptViewProps {
  onBack: () => void;
}

// 提示词配置视图：编辑两行文案，保存即生效，可恢复默认
function GreetingPromptView({ onBack }: GreetingPromptViewProps) {
  const preference = useLiveQuery(
    () => aiPreferenceStore.readAiPreference(),
    [],
    DEFAULT_AI_PREFERENCE,
  );
  const [task, setTask] = useState('');
  const [requirement, setRequirement] = useState('');
  const [saved, setSaved] = useState(false);

  // 偏好加载后回填输入框：未配置时用默认文案
  useEffect(() => {
    setTask(preference.greetingTask ?? DEFAULT_GREETING_TASK);
    setRequirement(
      preference.greetingRequirement ?? DEFAULT_GREETING_REQUIREMENT,
    );
  }, [preference]);

  // 保存文案：写入全局偏好，短暂提示已保存
  const handleSave = async (): Promise<void> => {
    await aiPreferenceStore.saveAiPreference({
      ...preference,
      greetingTask: task,
      greetingRequirement: requirement,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  // 恢复默认：清空配置并回填默认文案
  const handleReset = async (): Promise<void> => {
    await aiPreferenceStore.saveAiPreference({
      ...preference,
      greetingTask: null,
      greetingRequirement: null,
    });
    setTask(DEFAULT_GREETING_TASK);
    setRequirement(DEFAULT_GREETING_REQUIREMENT);
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            title="返回厂商列表"
            aria-label="返回厂商列表"
            onClick={onBack}
          >
            <Icons.chevronDown className="rotate-90" />
          </Button>
          <h2 className="text-base font-medium">提示词</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="xs" onClick={handleReset}>
            <Icons.refresh data-icon="inline-start" />
            <span>恢复默认</span>
          </Button>
          <Button size="xs" onClick={handleSave}>
            <Icons.edit data-icon="inline-start" />
            <span>{saved ? '已保存' : '保存'}</span>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        以下两行文案会拼在职位信息之前，构成打招呼的提示词；保存后立即生效。
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          任务描述
        </span>
        <Textarea
          rows={2}
          value={task}
          onChange={(event) => setTask(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          生成要求
        </span>
        <Textarea
          rows={3}
          value={requirement}
          onChange={(event) => setRequirement(event.target.value)}
        />
      </div>
    </div>
  );
}

export { GreetingPromptView };
