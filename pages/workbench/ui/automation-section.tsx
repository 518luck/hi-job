// # 聊天自动化区：可折叠的自动化档位仪表（去沟通自动问候与三场景投递）
import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Icons } from '@/shared/ui/icons';
import type { DeliveryScene } from '@/shared/zod';

import { useAiPreference } from '../model/use-ai-preference';

// 消息场景行配置：场景键与聊天窗文案统一（回复/提醒/反馈）
const SCENE_ROWS = [
  {
    scene: 'generateReply',
    label: '回复',
    description: '结合聊天记录生成回复后',
  },
  {
    scene: 'followUp',
    label: '提醒',
    description: '已读未回时生成跟进后',
  },
  {
    scene: 'rejectionFeedback',
    label: '反馈',
    description: '被拒后生成请教反馈后',
  },
] as const satisfies readonly {
  scene: DeliveryScene;
  label: string;
  description: string;
}[];

// 自动化档位：0 不动 / 1 自动填入 / 2 自动发送，驱动标题行状态灯
type AutoLevel = 0 | 1 | 2;

// 由两档开关折算档位（上游未开时下游不计入）
const levelOf = (fill: boolean, send: boolean): AutoLevel =>
  fill && send ? 2 : fill ? 1 : 0;

// 聊天自动化区：标题行四格状态灯折叠时也可读出各场景档位，展开是四行二档仪表轨
function AutomationSection() {
  const [open, setOpen] = useState(false);
  const {
    autoGreetOnGoChat,
    autoSendGreeting,
    sceneDelivery,
    setAutoGreetOnGoChat,
    setAutoSendGreeting,
    updateSceneDelivery,
  } = useAiPreference();

  // 标题行状态灯数据：去沟通 + 三场景，按行序排列
  const readouts = [
    {
      key: 'goChat',
      level: levelOf(autoGreetOnGoChat, autoSendGreeting),
    },
    ...SCENE_ROWS.map(({ scene }) => {
      const { fill, send } = sceneDelivery[scene];
      return { key: scene, level: levelOf(fill, send) };
    }),
  ];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col gap-1"
    >
      <CollapsibleTrigger className="group/trigger flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring/50">
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            聊天自动化
          </span>
          {/* // > 四格状态灯：空/半亮/全亮 = 不动/自动填入/自动发送，收起时也能读出配置姿态 */}
          <span
            aria-hidden
            className="flex items-center gap-1"
            title="依次为 去沟通/回复/提醒/反馈：全亮=自动发送，半亮=自动填入"
          >
            {readouts.map(({ key, level }) => (
              <Lamp key={key} level={level} />
            ))}
          </span>
        </span>
        <Icons.chevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-panel-open/trigger:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      {/* 动画外壳用无边框面板包裹带边框卡片：收起时卡片被完全裁掉，不留边框残影 */}
      <CollapsibleContent className="overflow-hidden data-open:animate-hijob-collapse-down data-closed:animate-hijob-collapse-up motion-reduce:animate-none">
        <div className="divide-y divide-border rounded-md border border-border">
          {/* // > 去沟通行：「生成」点亮才会自动发起问候；「发送」对自动与手动问候统一生效 */}
          <AutomationRow
            label="去沟通"
            description="进入聊天页自动生成问候；「发送」对手动问候同样生效"
          >
            <RailSegment
              rowLabel="去沟通"
              label="生成"
              active={autoGreetOnGoChat}
              onClick={() => {
                setAutoGreetOnGoChat(!autoGreetOnGoChat);
              }}
            />
            <RailSegment
              rowLabel="去沟通"
              label="发送"
              active={autoSendGreeting && autoGreetOnGoChat}
              disabled={!autoGreetOnGoChat}
              onClick={() => {
                setAutoSendGreeting(!autoSendGreeting);
              }}
            />
          </AutomationRow>
          {SCENE_ROWS.map(({ scene, label, description }) => {
            const delivery = sceneDelivery[scene];
            return (
              <AutomationRow
                key={scene}
                label={label}
                description={description}
              >
                <RailSegment
                  rowLabel={label}
                  label="填入"
                  active={delivery.fill}
                  onClick={() => {
                    updateSceneDelivery(scene, { fill: !delivery.fill });
                  }}
                />
                <RailSegment
                  rowLabel={label}
                  label="发送"
                  active={delivery.send && delivery.fill}
                  disabled={!delivery.fill}
                  onClick={() => {
                    updateSceneDelivery(scene, { send: !delivery.send });
                  }}
                />
              </AutomationRow>
            );
          })}
          {/* 底注：一句教学轨道隐喻 */}
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground/70">
            点亮到哪段，生成的内容就走到哪步
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// 自动化行的 props
interface AutomationRowProps {
  label: string; // 场景名
  description: string; // 场景时机说明
  children: ReactNode; // 仪表轨的两格（RailSegment × 2）
}

// 自动化行：场景名与说明在左，联体二档仪表轨在右，行间由外层 hairline 分隔
function AutomationRow({ label, description, children }: AutomationRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      {/* 联体仪表轨：等宽单元在各行右缘对齐成列，格间由 divide 分隔线表达档位次序 */}
      <span className="inline-flex shrink-0 divide-x divide-border overflow-hidden rounded-md border border-border">
        {children}
      </span>
    </div>
  );
}

// 轨道格的 props
interface RailSegmentProps {
  rowLabel: string; // 所属行名（去沟通/回复/提醒/反馈），读屏区分各场景用
  label: string; // 格名（生成/填入/发送）
  active: boolean; // 是否点亮：内容将推进到这一步
  disabled?: boolean; // 上游格未点亮时禁用
  onClick?: () => void; // 点击切换点亮状态
}

// 轨道格：仪表轨的等宽单元，点亮格带底色与指示灯；禁用格表达上游依赖
function RailSegment({
  rowLabel,
  label,
  active,
  disabled = false,
  onClick,
}: RailSegmentProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${rowLabel}·${label}自动化`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-14 items-center justify-center gap-1 py-1 text-[11px] leading-4 transition-colors outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring/50',
        active
          ? 'bg-primary/15 text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        disabled ? 'pointer-events-none opacity-40' : '',
      )}
    >
      {/* 指示灯：方寸 LED 呼应 mono 仪表气质 */}
      <span
        aria-hidden
        className={cn(
          'size-1 rounded-[1px]',
          active ? 'bg-primary' : 'bg-muted-foreground/40',
        )}
      />
      {label}
    </button>
  );
}

// 状态灯的 props
interface LampProps {
  level: AutoLevel; // 0 熄 / 1 半亮（自动填入）/ 2 全亮（自动发送）
}

// 标题行状态灯：折叠态下的自动化姿态读出
function Lamp({ level }: LampProps) {
  // 状态灯底色：全亮/半亮/熄灭三档
  const tone =
    level === 2
      ? 'bg-primary'
      : level === 1
        ? 'bg-primary/40'
        : 'bg-muted-foreground/20';
  return (
    <span
      aria-hidden
      className={cn('size-1.5 rounded-xs transition-colors', tone)}
    />
  );
}

export { AutomationSection };
