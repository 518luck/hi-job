// # 操作演示：循环演出「职位页 → 指针点击侧边栏去沟通 → 跳转聊天页（带侧边栏与液态玻璃按钮）→ 军师窗流式输出 → 点击回复送达」

import {
  BookOpen,
  ChevronDown,
  LayoutGrid,
  MessageSquareText,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '../../lib/utils';
import { MessagePair } from '../chat-demo/message-pair';
import { pickThinkingPhrase } from '../chat-demo/phrases';
import { ReasoningPanel } from '../chat-demo/reasoning-panel';
import type { DemoScript } from '../chat-demo/scripts';
import { TypingIndicator } from '../chat-demo/typing-indicator';
import { useScriptedStream } from '../chat-demo/use-scripted-stream';

// @ 时间轴节奏（毫秒）
const HOLD_LIST_MS = 900; // 职位页停留
const MOVE_MS = 950; // 指针移动时长（与 CSS transition 同步）
const CLICK_MS = 500; // 点击停留（含涟漪）
const CHAT_ENTER_MS = 900; // 聊天页入场停留
const AI_OPEN_MS = 500; // 军师窗弹出
const DONE_TO_REPLY_MS = 600; // 输出完成到指针动身的间隔
const CURSOR_REAPPEAR_MS = 350; // 指针原地淡入后动身的等待（让位移过渡可见）
const SENT_HOLD_MS = 3600; // 送达后停留再循环

// 演示剧本：嵌入式岗位的走心开场白（周女士 · 泰琪丰）
const DEMO_SCRIPT: DemoScript = {
  phrase: '开场白要真诚，别模板化',
  reasoning: [
    'JD 要嵌入式经验，我的主战场在 Web',
    '先接住行业兴趣，再迁移工程能力',
    '不硬凑匹配度，把问题轻轻递回去',
    '百字以内收住，真诚比华丽重要',
  ],
  reply:
    '周女士您好。我是一名全栈开发者，长期深耕 Web 性能与工程化；注意到贵司在新能源嵌入式方向的布局，正是我想深入的行业。跨领域迁移我有完整方法论，也有快速落地的过往成绩。方便的话，想请教这个岗位当前最希望解决什么问题？',
};
const SCRIPTS: readonly DemoScript[] = [DEMO_SCRIPT];

// 演示阶段：驱动场景切换、指针与流式输出
type Phase =
  | 'list' // 职位页
  | 'to-contact' // 指针移向去沟通
  | 'click-contact' // 点击去沟通
  | 'chat' // 聊天页入场
  | 'ai-open' // 军师窗弹出
  | 'streaming' // 军师流式输出（等 hook 播完）
  | 'to-reply' // 指针移向回复
  | 'click-reply' // 点击回复
  | 'sent'; // 消息送达，停留后循环

interface Point {
  x: number;
  y: number;
}

// 目标元素相对坐标基准容器的中心坐标（指针落点）
const pointAt = (
  container: Element | null,
  el: Element | null,
): Point | null => {
  if (!container || !el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  const base = container.getBoundingClientRect();
  return {
    x: rect.left - base.left + rect.width / 2,
    y: rect.top - base.top + rect.height / 2,
  };
};

// 操作演示主组件：BOSS 页面 + 扩展侧边栏双场景交叉淡入淡出，进入视口后循环演出
export function OperationDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const replyRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>('list');
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scene: 'list' | 'chat' =
    phase === 'list' || phase === 'to-contact' || phase === 'click-contact'
      ? 'list'
      : 'chat';
  // 军师窗开演时机：聊天页入场后启动流式时间轴；离屏不跑
  const aiOpen = scene === 'chat' && phase !== 'chat';
  const stream = useScriptedStream({
    scripts: SCRIPTS,
    cycle: false,
    enabled: aiOpen && inView,
  });

  // 进入视口才开演，离开冻结（重进从当前阶段续播）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 减弱动态检测：直接呈现终态静态画面
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      setReducedMotion(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // 主时间轴：每个阶段只安排自己的下一步，stream.phase 驱动输出完成分支
  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reducedMotion) {
      setPhase('sent');
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, step: () => void): void => {
      timers.push(setTimeout(step, ms));
    };

    switch (phase) {
      case 'list': {
        // 不可见时先把指针复位到起点，稍后原地淡入
        const box = stageRef.current?.getBoundingClientRect();
        setCursorVisible(false);
        if (box) {
          setCursor({ x: box.width * 0.3, y: box.height * 0.8 });
        }
        after(400, () => setCursorVisible(true));
        after(400 + HOLD_LIST_MS, () => setPhase('to-contact'));
        break;
      }
      case 'to-contact': {
        const point = pointAt(stageRef.current, goRef.current);
        if (point) {
          setCursor(point);
        }
        after(MOVE_MS + 150, () => setPhase('click-contact'));
        break;
      }
      case 'click-contact':
        after(CLICK_MS, () => setPhase('chat'));
        break;
      case 'chat':
        // 只隐藏不卸载，保留旧坐标供输出完成后原地淡入
        setCursorVisible(false);
        after(CHAT_ENTER_MS, () => setPhase('ai-open'));
        break;
      case 'ai-open':
        after(AI_OPEN_MS, () => setPhase('streaming'));
        break;
      case 'streaming':
        if (stream.phase === 'done') {
          after(DONE_TO_REPLY_MS, () => {
            // 先在旧坐标淡入，稍后再动身，让位移过渡可见
            setCursorVisible(true);
            after(CURSOR_REAPPEAR_MS, () => {
              const point = pointAt(stageRef.current, replyRef.current);
              if (point) {
                setCursor(point);
              }
              setPhase('to-reply');
            });
          });
        }
        break;
      case 'to-reply':
        after(MOVE_MS + 150, () => setPhase('click-reply'));
        break;
      case 'click-reply':
        after(CLICK_MS, () => setPhase('sent'));
        break;
      case 'sent':
        after(SENT_HOLD_MS, () => setPhase('list'));
        break;
    }
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [phase, inView, reducedMotion, stream.phase]);

  return (
    <div
      ref={containerRef}
      className="chat-demo mx-auto w-full max-w-5xl select-none overflow-x-auto rounded-xl border border-border shadow-2xl"
    >
      {/* 舞台层：小屏横向滚动的最小宽度载体，指针与场景坐标都以它为基准 */}
      <div ref={stageRef} className="relative aspect-16/10 min-w-225">
        {/* 双场景常挂载交叉淡入淡出，切换瞬间不露空容器 */}
        <div
          className={cn(
            'boss-layer absolute inset-0',
            scene !== 'list' && 'pointer-events-none opacity-0 scale-[0.985]',
          )}
        >
          <div className="flex h-full">
            <BossJobsPage />
            <WorkbenchSidebar
              variant="job"
              goRef={goRef}
              pressing={phase === 'click-contact'}
            />
          </div>
        </div>
        <div
          className={cn(
            'boss-layer absolute inset-0',
            scene !== 'chat' && 'pointer-events-none opacity-0 scale-[0.985]',
          )}
        >
          <div className="flex h-full">
            <BossChatPage sent={phase === 'sent'} replyText={DEMO_SCRIPT.reply}>
              {aiOpen && (
                <StrategistWindow
                  stream={stream}
                  replyRef={replyRef}
                  pressing={phase === 'click-reply'}
                />
              )}
            </BossChatPage>
            <WorkbenchSidebar variant="hr" />
          </div>
        </div>
        <CursorDot
          point={cursor}
          visible={cursorVisible}
          clicking={phase === 'click-contact' || phase === 'click-reply'}
        />
      </div>
    </div>
  );
}

// 场景一页面：简化 BOSS 职位页（左卡片列表 + 右详情）
function BossJobsPage() {
  return (
    <div className="boss-mock flex min-w-0 flex-1 flex-col bg-[#f5f5f5]">
      <BossTopBar active="职位" />
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        {/* 职位卡片列表 */}
        <div className="flex w-[46%] flex-col gap-2 overflow-hidden">
          <JobCard
            title="软件工程师"
            salary="8-12K"
            tags={['经验不限', '大专', 'UPS', 'BMS']}
            company="泰琪丰"
            active
          />
          <JobCard
            title="SLAM 算法工程师"
            salary="22-40K·13薪"
            tags={['3-5年', '本科', 'AGV', 'C++']}
            company="汇智造达"
          />
          <JobCard
            title="前端开发工程师"
            salary="10-15K"
            tags={['经验不限', '本科']}
            company="南海智科"
          />
        </div>
        {/* 职位详情 */}
        <div className="min-w-0 flex-1 rounded-md bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#333]">
                软件工程师<span className="ml-2 text-[#ff5f33]">8-12K</span>
              </p>
              <p className="mt-1 text-[10px] text-[#999]">
                佛山 · 经验不限 · 大专
              </p>
            </div>
            <span className="shrink-0 rounded bg-[#00bebd] px-4 py-1.5 text-xs font-medium text-white">
              立即沟通
            </span>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-[#666]">职位描述</p>
          <div className="mt-2 flex flex-col gap-2">
            {[92, 84, 88, 70, 80, 56].map((width) => (
              <div
                key={width}
                className="h-2 rounded bg-[#ececec]"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 场景二页面：简化 BOSS 聊天页（左联系人 + 右会话），挂液态玻璃按钮与军师窗
function BossChatPage({
  sent,
  replyText,
  children,
}: {
  sent: boolean;
  replyText: string;
  children?: ReactNode;
}) {
  return (
    <div className="boss-mock relative flex min-w-0 flex-1 flex-col bg-[#f5f5f5]">
      <BossTopBar active="消息" />
      <div className="flex min-h-0 flex-1">
        {/* 联系人列表 */}
        <div className="flex w-[34%] flex-col border-r border-[#e8e8e8] bg-white">
          <div className="m-2 rounded bg-[#f5f5f5] px-2 py-1.5 text-[10px] text-[#bbb]">
            搜索 30 天内的联系人
          </div>
          <ContactRow
            name="周女士"
            meta="泰琪丰 · 人事招聘主管"
            time="04:23"
            active
          />
          <ContactRow name="唐女士" meta="赞同科技 · 招聘专员" time="01:40" />
        </div>
        {/* 会话区 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[#e8e8e8] bg-white px-4 py-2">
            <p className="text-xs font-semibold text-[#333]">
              周女士
              <span className="ml-2 font-normal text-[#999]">
                泰琪丰 | 人事招聘主管
              </span>
            </p>
            <p className="mt-0.5 text-[10px] text-[#00bebd]">
              软件工程师 8-12K
            </p>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden p-4">
            <div className="flex flex-col gap-3">
              <ChatBubble
                side="left"
                text="你好，看了你的简历，对我们这个岗位感兴趣吗？"
              />
              {/* 送达气泡：与军师输出同一句话 */}
              {sent && (
                <div className="boss-bubble flex flex-col items-end gap-1">
                  <ChatBubble side="right" text={replyText} />
                  <span className="text-[9px] text-[#bbb]">送达</span>
                </div>
              )}
            </div>
            {children}
          </div>
          <div className="m-2 rounded bg-white px-3 py-2 text-[10px] text-[#ccc]">
            按 Enter 键发送
          </div>
        </div>
      </div>
      {/* 液态玻璃悬浮按钮：与扩展同款停靠位（left 16 / bottom 56） */}
      <span className="hijob-fab-demo absolute bottom-14 left-4">AI 回复</span>
    </div>
  );
}

// 扩展侧边栏：直角深色工作台（JetBrains Mono），职位页/聊天页两种卡片变体 + 右侧菜单栏
function WorkbenchSidebar({
  variant,
  goRef,
  pressing = false,
}: {
  variant: 'job' | 'hr';
  goRef?: RefObject<HTMLButtonElement | null>;
  pressing?: boolean;
}) {
  return (
    <div className="flex w-[320px] shrink-0 border-l border-border bg-background font-sans text-foreground">
      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3">
        <h3 className="text-base font-medium">工作台</h3>
        {variant === 'job' ? (
          <CompanyCard goRef={goRef} pressing={pressing} />
        ) : (
          <HrCard />
        )}
        {/* 厂商 / 模型 / 思考模式选择器 */}
        <div className="grid grid-cols-2 gap-2">
          <SelectMock value="Deepseek" />
          <SelectMock value="deepseek-v4-flash" />
          <div className="col-span-2">
            <SelectMock value="思考：高（传 reasoning: high）" />
          </div>
        </div>
        {/* 聊天自动化：四灯指示行 */}
        <div className="flex items-center justify-between px-1 py-1">
          <span className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              聊天自动化
            </span>
            <span aria-hidden className="flex items-center gap-1">
              <span className="size-1.5 rounded-xs bg-primary" />
              <span className="size-1.5 rounded-xs bg-primary" />
              <span className="size-1.5 rounded-xs bg-primary/40" />
              <span className="size-1.5 rounded-xs bg-muted-foreground/20" />
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
        {variant === 'job' ? <ResumeCollapsed /> : <ResumeExpanded />}
        {/* 简历外补充折叠行 */}
        <div className="flex items-center justify-between px-1 py-1">
          <span className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              简历外补充
            </span>
            <span
              aria-hidden
              className="size-1.5 rounded-xs bg-muted-foreground/20"
            />
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
      </div>
      {/* 右侧菜单栏 */}
      <nav className="flex w-9 shrink-0 flex-col items-center gap-1 border-l border-border py-2">
        <SideIcon active>
          <LayoutGrid className="size-4" />
        </SideIcon>
        <SideIcon>
          <BookOpen className="size-4" />
        </SideIcon>
        <SideIcon>
          <Settings className="size-4" />
        </SideIcon>
        <SideIcon>
          <Sun className="size-4" />
        </SideIcon>
      </nav>
    </div>
  );
}

// 公司卡（职位页）：屏蔽按钮 + 规模/行业徽章 + HR 活跃状态 + 去沟通（指针目标）
function CompanyCard({
  goRef,
  pressing,
}: {
  goRef?: RefObject<HTMLButtonElement | null>;
  pressing: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border border-primary/40 bg-primary/5 p-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          泰琪丰
        </span>
        <span className="h-6 shrink-0 border border-border bg-input/30 px-2 text-xs whitespace-nowrap leading-6">
          屏蔽该公司
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        <SidebarBadge>1000-9999人</SidebarBadge>
        <SidebarBadge>储能</SidebarBadge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          HR 活跃状态：刚刚活跃
        </p>
        <button
          ref={goRef}
          type="button"
          className={cn(
            'flex h-6 shrink-0 items-center gap-1 border border-border bg-input/30 pl-1.5 pr-2 text-xs transition-transform',
            pressing && 'scale-90',
          )}
        >
          <MessageSquareText className="size-3" />
          去沟通
        </button>
      </div>
    </div>
  );
}

// HR 会话卡（聊天页）：姓名职位 + 刚刚沟通 + Pass + 公司 + JD 手风琴行
function HrCard() {
  return (
    <div className="flex flex-col gap-2 border border-primary/40 bg-primary/5 p-3">
      <div className="flex items-baseline gap-1 text-sm">
        <span className="truncate font-medium">周女士</span>
        <span className="shrink-0 text-xs font-normal text-muted-foreground">
          人事招聘主管
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-xs font-normal text-muted-foreground">
            刚刚沟通
          </span>
          <span className="h-6 bg-destructive/20 px-2 text-xs leading-6 text-destructive">
            Pass
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">泰琪丰</p>
      <div className="border-t border-border" />
      <div className="flex items-center gap-2 py-1">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          软件工程师
        </span>
        <span className="shrink-0 text-xs text-primary">8-12K</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}

// 简历折叠态：标题 + 上传/AI 梳理/恢复/删除按钮组
function ResumeCollapsed() {
  return (
    <div className="flex items-center justify-between gap-1 rounded-md border border-border p-2">
      <ResumeTitle />
      <ResumeActions />
    </div>
  );
}

// 简历展开态：文件名 + 内容预览（固定高度滚动，细滚动条）
function ResumeExpanded() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-md border border-border p-2">
      <div className="flex items-center justify-between gap-1">
        <ResumeTitle open />
        <ResumeActions />
      </div>
      <p className="text-xs text-muted-foreground">
        示例-前端&全栈-13800000000.md（已 AI 梳理，原版已备份）
      </p>
      <div className="hijob-chat-scroll min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/50 p-2 text-xs">
        <p className="mb-1 text-sm font-semibold">核心技能</p>
        <ul className="my-1 list-disc pl-4">
          <li className="my-0.5">
            <span className="font-semibold">前端架构：</span>
            React 19、Next.js、TypeScript；主导百万 DAU
            产品前端架构，微前端落地 30+ 人团队
          </li>
          <li className="my-0.5">
            <span className="font-semibold">后端与高并发：</span>
            Node.js、Go、Prisma；设计 10 万 QPS
            网关与限流降级，核心链路可用性 99.99%
          </li>
          <li className="my-0.5">
            <span className="font-semibold">数据与 AI 工程：</span>
            PostgreSQL、Redis、Kafka；落地 RAG 与 Agent
            工作流，AI 客服人效提升 40%
          </li>
          <li className="my-0.5">
            <span className="font-semibold">工程与影响力：</span>
            Docker、K8s、Argo CD；5k+ Star
            开源项目维护者，技术博客 10w+ 阅读
          </li>
        </ul>
        <p className="mb-1 mt-2 text-sm font-semibold">工作经历亮点</p>
        <p className="my-1">
          主导低代码渲染引擎重构，首屏 2.1s 降至 0.8s（-62%），获年度技术突破奖；推动
          AI Agent 在三条业务线落地，人效提升 40%。
        </p>
      </div>
    </div>
  );
}

// 简历区标题：chevron + 文案
function ResumeTitle({ open = false }: { open?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5 px-1 text-xs font-medium whitespace-nowrap">
      <ChevronDown
        className={cn('size-3.5 text-muted-foreground', !open && '-rotate-90')}
      />
      简历
    </span>
  );
}

// 简历区按钮组：上传 / AI 梳理 / 恢复 / 删除
function ResumeActions() {
  return (
    <span className="flex shrink-0 gap-1">
      <span className="grid size-6 place-items-center border border-border bg-input/30">
        <Upload className="size-3" />
      </span>
      <span className="flex h-6 items-center gap-1 border border-border bg-input/30 px-2 text-xs whitespace-nowrap">
        <Sparkles className="size-3" />
        AI 梳理
      </span>
      <span className="h-6 border border-border bg-input/30 px-2 text-xs whitespace-nowrap leading-6">
        恢复
      </span>
      <span className="grid size-6 place-items-center bg-destructive/20 text-destructive">
        <Trash2 className="size-3" />
      </span>
    </span>
  );
}

// 侧边栏徽章：直角描边小标签
function SidebarBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-fit items-center border border-border px-2 text-xs font-medium whitespace-nowrap">
      {children}
    </span>
  );
}

// 选择器模拟：直角触发器 + 右侧箭头
function SelectMock({ value }: { value: string }) {
  return (
    <span className="flex h-8 w-full items-center justify-between gap-1.5 border border-input bg-input/30 px-2.5 text-xs whitespace-nowrap">
      <span className="truncate">{value}</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
    </span>
  );
}

// 菜单栏图标：激活项加底
function SideIcon({
  active = false,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded p-1.5 text-muted-foreground',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </span>
  );
}

// 军师窗：与扩展聊天窗同材料同尺寸（340×420，正文固定高度滚动）
function StrategistWindow({
  stream,
  replyRef,
  pressing,
}: {
  stream: ReturnType<typeof useScriptedStream>;
  replyRef: RefObject<HTMLButtonElement | null>;
  pressing: boolean;
}) {
  const {
    script,
    phase,
    visibleReasoningLines,
    visibleWords,
    elapsedSeconds,
    ttftMs,
    words,
    restingSeconds,
  } = stream;
  const isWaiting = phase === 'waiting';
  const isThinking = phase === 'thinking';

  // 流式滚底：思考行/正文增长时贴到最新处，对齐真实产品行为
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref 不参与依赖，刻意以阶段与可见计数驱动滚底
  useEffect(() => {
    const body = bodyRef.current;
    if (body === null) {
      return;
    }
    body.scrollTop = body.scrollHeight;
  }, [phase, visibleWords, visibleReasoningLines]);

  return (
    <div className="boss-pop absolute bottom-4 left-3 flex h-105 w-85 flex-col overflow-hidden rounded-[12px] border border-white/10 bg-[#09090b]/70 text-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_64px_-16px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150">
      {/* 标题栏：军师招牌 + 时序统计 + 关闭 */}
      <div className="flex items-center justify-between border-b border-white/6 bg-white/4 px-3.5 py-2">
        <span className="text-[13px] font-semibold">求职军师</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/50 tabular-nums">
            {ttftMs !== null && (
              <span className="flex flex-col items-center leading-none">
                <span className="text-foreground/30 mb-0.5 text-[9px]">
                  ttft
                </span>
                {(ttftMs / 1000).toFixed(1)}s
              </span>
            )}
            <span className="flex flex-col items-center leading-none">
              <span className="text-foreground/30 mb-0.5 text-[9px]">
                total
              </span>
              {phase === 'done'
                ? `${restingSeconds.toFixed(1)}s`
                : `${(elapsedSeconds + 0.4).toFixed(1)}s`}
            </span>
          </div>
          <X aria-hidden className="text-foreground/40 size-3.5" />
        </div>
      </div>
      {/* 正文区：窗高固定，内容超出即滚动 */}
      <div
        ref={bodyRef}
        className="hijob-chat-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3 text-[13px] leading-[1.8]"
      >
        <MessagePair
          userMessage={script.phrase}
          words={words}
          visibleWords={visibleWords}
          streaming={phase === 'streaming'}
        >
          {isWaiting ? (
            <TypingIndicator variant="bare" className="py-2" />
          ) : (
            <ReasoningPanel
              steps={script.reasoning.map((title) => ({ title }))}
              visibleSteps={visibleReasoningLines}
              streaming={isThinking}
              open
              onOpenChange={() => {}}
              restingLabel={`思考了 ${restingSeconds} 秒`}
              streamingLabel={pickThinkingPhrase(Date.now())}
              elapsed={isThinking ? `${elapsedSeconds}s` : undefined}
            />
          )}
        </MessagePair>
      </div>
      {/* 操作区：回复为主按钮（指针点击目标） */}
      <div className="flex gap-2 border-t border-white/6 bg-white/4 px-3.5 py-2.5">
        <span className="flex-1 rounded-none border border-border py-1 text-center text-[13px]">
          问候
        </span>
        <button
          ref={replyRef}
          type="button"
          className={cn(
            'flex-1 rounded-none bg-foreground py-1 text-center text-[13px] text-background transition-transform',
            pressing && 'scale-90',
          )}
        >
          回复
        </button>
        <span className="flex-1 rounded-none border border-border py-1 text-center text-[13px]">
          提醒
        </span>
        <span className="flex-1 rounded-none border border-border py-1 text-center text-[13px]">
          反馈
        </span>
        <span className="flex-1 rounded-none border border-border py-1 text-center text-[13px]">
          复制
        </span>
      </div>
    </div>
  );
}

// 职位卡片：标题 + 薪资 + 标签 + 公司
function JobCard({
  title,
  salary,
  tags,
  company,
  active = false,
}: {
  title: string;
  salary: string;
  tags: readonly string[];
  company: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-md bg-white p-2.5',
        active && 'border-2 border-[#00bebd]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-[#333]">
          {title}
        </span>
        <span className="shrink-0 text-xs font-semibold text-[#ff5f33]">
          {salary}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm bg-[#f5f5f5] px-1 py-0.5 text-[9px] text-[#888]"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[9px] text-[#999]">{company}</p>
    </div>
  );
}

// 联系人行：头像 + 姓名 meta + 时间
function ContactRow({
  name,
  meta,
  time,
  active = false,
}: {
  name: string;
  meta: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2.5 py-2',
        active && 'bg-[#e9f8f7]',
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffd8b8] text-[11px] font-semibold text-[#b8621b]">
        {name[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-[#333]">{name}</p>
        <p className="truncate text-[9px] text-[#999]">{meta}</p>
      </div>
      <span className="shrink-0 text-[9px] text-[#bbb]">{time}</span>
    </div>
  );
}

// 聊天气泡：左白右青
function ChatBubble({ side, text }: { side: 'left' | 'right'; text: string }) {
  return (
    <div
      className={cn(
        'max-w-[75%] rounded-md px-2.5 py-1.5 text-[11px] leading-relaxed text-[#333]',
        side === 'left' ? 'self-start bg-white' : 'self-end bg-[#d9f5f3]',
      )}
    >
      {text}
    </div>
  );
}

// 模拟 BOSS 顶部导航：logo + 主导航，激活项品牌色
function BossTopBar({ active }: { active: string }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-5 border-b border-[#e8e8e8] bg-white px-4">
      <span className="text-sm font-bold text-[#00bebd]">
        BOSS<span className="ml-0.5 text-[#333]">直聘</span>
      </span>
      {['首页', '职位', '消息', '简历'].map((item) => (
        <span
          key={item}
          className={cn(
            'text-[11px]',
            item === active ? 'font-medium text-[#00bebd]' : 'text-[#666]',
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// 鼠标指针：外层管位移缓动、内层管淡入淡出，点击时发涟漪
function CursorDot({
  point,
  visible,
  clicking,
}: {
  point: Point;
  visible: boolean;
  clicking: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20 transition-transform duration-950 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
    >
      <div
        className={cn(
          'transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {clicking && (
          <span className="boss-ripple absolute -inset-2 rounded-full border-2 border-[#00bebd]" />
        )}
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: 装饰性指针图标，已 aria-hidden，无需标题 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          className="drop-shadow-sm"
          aria-hidden
        >
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
            fill="#fff"
            stroke="#000"
            strokeWidth="1.4"
          />
        </svg>
      </div>
    </div>
  );
}
