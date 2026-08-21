// # 演示剧本：俏皮话 → 思考行 → 正文回复的三组脚本，循环随机演出

// 单个演示剧本：一条用户俏皮话配思考行与最终回复
export interface DemoScript {
  phrase: string; // 用户侧俏皮话气泡
  reasoning: string[]; // 思考行（逐行浮现）
  reply: string; // AI 正文（逐词流式）
}

// 演示剧本表：内容取真实场景口吻
export const DEMO_SCRIPTS: readonly DemoScript[] = [
  {
    phrase: '帮我想句开场白',
    reasoning: [
      '看职位要求：React 与性能优化是重点',
      '简历里最匹配的是渲染引擎那段经历',
      '用数据量化效果，别堆形容词',
      '控制在一百字内，结尾自然收口',
    ],
    reply:
      '您好，看到贵司在招前端工程师。我目前在做低代码平台，负责渲染引擎的性能优化，把首屏耗时从 2.1s 降到了 0.8s，和职位里的性能要求比较契合。方便的话想进一步了解团队构成，期待交流。',
  },
  {
    phrase: '对方已读不回，帮我追一句',
    reasoning: [
      '上次话题停在作品集',
      '追问别施压，给个轻量钩子',
      '补一句新进展，让回复有理由',
    ],
    reply:
      '您好，前几天聊到的作品集我又补了两版动效 demo，链接已经更新。您最近方便的话欢迎看看，也期待您的反馈～',
  },
  {
    phrase: '这句怎么回，在线等',
    reasoning: [
      '对方问的是到岗时间',
      '如实说，同时给出确定性',
      '顺带表达诚意，不啰嗦',
    ],
    reply:
      '您好，我目前离职状态，一周内可以到岗。流程上还有需要补充的材料随时告诉我，我尽快配合～',
  },
];

// 挑选下一个剧本的入参
export interface PickNextScriptOptions {
  scripts: readonly DemoScript[]; // 候选剧本表
  previousIndex: number; // 上一条剧本下标（避免连续重复）
}

// 随机挑下一个剧本：避免与上一条重复
export const pickNextScript = ({
  scripts,
  previousIndex,
}: PickNextScriptOptions): { script: DemoScript; index: number } => {
  const next = Math.floor(Math.random() * scripts.length);
  const index =
    scripts.length > 1 && next === previousIndex
      ? (next + 1) % scripts.length
      : next;
  return { script: scripts[index] ?? scripts[0], index };
};
