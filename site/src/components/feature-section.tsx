import {
  Ban,
  ClipboardList,
  type LucideIcon,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';

// 功能卡片数据：图标 + 标题 + 描述 + 要点
const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
  points: readonly string[];
}[] = [
  {
    icon: Sparkles,
    title: 'AI 求职助手',
    description: '结合职位、HR 档案与你的简历，AI 生成打招呼与回复。',
    points: [
      '11 家厂商预设一键启用，也支持自定义接口',
      '打招呼 / 回复 / 跟进 / 请教反馈四种场景',
      '玻璃质感聊天窗：思考流、逐词输出与耗时统计实时可见',
      '思考模式五档切换，用量统计完整记录',
    ],
  },
  {
    icon: ClipboardList,
    title: '职位自动记录',
    description: '点开过的职位自动全字段入库，转头就忘成为历史。',
    points: [
      '职位名、薪资、公司、JD、标签等全字段记录',
      '列表卡片直接显示公司规模，外包一眼可辨',
      '工作台实时显示当前职位的公司信息',
    ],
  },
  {
    icon: MessagesSquare,
    title: 'HR 沟通管理',
    description: '聊天页自动建档，谁是谁、聊到哪，一目了然。',
    points: [
      'HR 姓名、头衔、公司、最后消息自动同步',
      '一键 Pass 后会话盖遮罩，不再打扰',
      '超过一天未回复自动标记提醒',
    ],
  },
  {
    icon: Ban,
    title: '屏蔽公司',
    description: '不想投的公司，从列表里消失。',
    points: [
      '名单式管理，支持批量粘贴与模板导入',
      '命中即遮罩，显示命中词与公司原名',
      '公司信息卡上一键屏蔽当前公司',
    ],
  },
];

// 功能特性区：四大能力卡片网格
export function FeatureSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        把琐碎动作收拢到侧边栏
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description, points }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{description}</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span aria-hidden>·</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
