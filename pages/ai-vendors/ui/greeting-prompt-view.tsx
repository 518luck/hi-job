// # 提示词配置视图：三场景（打招呼/跟进/回复）的系统提示、任务描述与生成要求

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import {
  DEFAULT_FOLLOW_UP_REQUIREMENT,
  DEFAULT_FOLLOW_UP_SYSTEM,
  DEFAULT_FOLLOW_UP_TASK,
  DEFAULT_GREETING_REQUIREMENT,
  DEFAULT_GREETING_SYSTEM,
  DEFAULT_GREETING_TASK,
  DEFAULT_REPLY_REQUIREMENT,
  DEFAULT_REPLY_SYSTEM,
  DEFAULT_REPLY_TASK,
} from '@/shared/infra/ai';
import {
  aiPreferenceStore,
  DEFAULT_AI_PREFERENCE,
} from '@/shared/infra/storage';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import { Textarea } from '@/shared/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

// 提示词场景：打招呼/跟进/回复
type PromptScene = 'greeting' | 'followUp' | 'reply';

// 场景配置：偏好字段键与默认文案
const SCENE_CONFIGS: Record<
  PromptScene,
  {
    label: string; // 场景名
    systemKey: 'greetingSystem' | 'followUpSystem' | 'replySystem'; // 系统提示偏好字段
    taskKey: 'greetingTask' | 'followUpTask' | 'replyTask'; // 任务描述偏好字段
    requirementKey:
      | 'greetingRequirement'
      | 'followUpRequirement'
      | 'replyRequirement'; // 生成要求偏好字段
    defaultSystem: string; // 默认系统提示
    defaultTask: string; // 默认任务描述
    defaultRequirement: string; // 默认生成要求
  }
> = {
  greeting: {
    label: '打招呼',
    systemKey: 'greetingSystem',
    taskKey: 'greetingTask',
    requirementKey: 'greetingRequirement',
    defaultSystem: DEFAULT_GREETING_SYSTEM,
    defaultTask: DEFAULT_GREETING_TASK,
    defaultRequirement: DEFAULT_GREETING_REQUIREMENT,
  },
  followUp: {
    label: '跟进',
    systemKey: 'followUpSystem',
    taskKey: 'followUpTask',
    requirementKey: 'followUpRequirement',
    defaultSystem: DEFAULT_FOLLOW_UP_SYSTEM,
    defaultTask: DEFAULT_FOLLOW_UP_TASK,
    defaultRequirement: DEFAULT_FOLLOW_UP_REQUIREMENT,
  },
  reply: {
    label: '回复',
    systemKey: 'replySystem',
    taskKey: 'replyTask',
    requirementKey: 'replyRequirement',
    defaultSystem: DEFAULT_REPLY_SYSTEM,
    defaultTask: DEFAULT_REPLY_TASK,
    defaultRequirement: DEFAULT_REPLY_REQUIREMENT,
  },
};

// 提示词配置视图的 props：onBack 返回厂商列表
interface GreetingPromptViewProps {
  onBack: () => void;
}

// 提示词配置视图：按场景编辑系统提示、任务描述与生成要求，保存即生效，可恢复默认
function GreetingPromptView({ onBack }: GreetingPromptViewProps) {
  const preference = useLiveQuery(
    () => aiPreferenceStore.readAiPreference(),
    [],
    DEFAULT_AI_PREFERENCE,
  );
  const [scene, setScene] = useState<PromptScene>('greeting');
  const [system, setSystem] = useState('');
  const [task, setTask] = useState('');
  const [requirement, setRequirement] = useState('');
  const [saved, setSaved] = useState(false);
  const {
    systemKey,
    taskKey,
    requirementKey,
    defaultSystem,
    defaultTask,
    defaultRequirement,
  } = SCENE_CONFIGS[scene];

  // 偏好或场景切换后回填输入框：未配置时用默认文案
  useEffect(() => {
    setSystem(preference[systemKey] ?? defaultSystem);
    setTask(preference[taskKey] ?? defaultTask);
    setRequirement(preference[requirementKey] ?? defaultRequirement);
  }, [
    preference,
    systemKey,
    taskKey,
    requirementKey,
    defaultSystem,
    defaultTask,
    defaultRequirement,
  ]);

  // 保存文案：写入全局偏好对应场景字段，短暂提示已保存
  const handleSave = async (): Promise<void> => {
    await aiPreferenceStore.saveAiPreference({
      ...preference,
      [systemKey]: system,
      [taskKey]: task,
      [requirementKey]: requirement,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  // 恢复默认：清空当前场景配置并回填默认文案
  const handleReset = async (): Promise<void> => {
    await aiPreferenceStore.saveAiPreference({
      ...preference,
      [systemKey]: null,
      [taskKey]: null,
      [requirementKey]: null,
    });
    setSystem(defaultSystem);
    setTask(defaultTask);
    setRequirement(defaultRequirement);
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
      <ToggleGroup
        variant="outline"
        className="w-full"
        value={[scene]}
        onValueChange={(values) => {
          const next = values[0];
          if (next !== undefined) {
            setScene(next as PromptScene);
          }
        }}
      >
        {(Object.keys(SCENE_CONFIGS) as PromptScene[]).map((key) => (
          <ToggleGroupItem key={key} value={key} className="flex-1">
            {SCENE_CONFIGS[key].label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        系统提示限定角色与输出规则，任务描述与生成要求会拼在职位信息之前；
        保存后立即生效。
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          系统提示
        </span>
        <Textarea
          rows={3}
          value={system}
          onChange={(event) => setSystem(event.target.value)}
        />
      </div>
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
