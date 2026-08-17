// # hr 表数据字典：HR 档案底表，含插件自标状态
import { z } from 'zod';

// 自标状态集合：excluded 表示已排除（移出候选），后续可扩展其他状态
const HR_STATUSES = ['excluded'] as const;

// 表 hr（HR 档案）落库实体：主键 encryptBossId
const hrSchema = z.object({
  encryptBossId: z.string(), // HR 会话唯一 id（BOSS 加密 id）
  encryptJobId: z.string(), // 会话关联职位的唯一 id
  bossName: z.string(), // 招聘者姓名
  bossTitle: z.string(), // 招聘者头衔（如 HR、招聘经理）
  brandName: z.string(), // 公司名称
  avatar: z.string(), // 招聘者头像 URL，读不到为空串
  city: z.string(), // 招聘者所在城市，读不到为空串
  lastText: z.string(), // 会话最后一条消息文本
  lastMsgAt: z.number(), // 最后一条消息时间戳（毫秒），读不到为 0
  lastIsSelf: z.boolean(), // 最后一条消息是否为自己发出，false 表示 HR 发的最后一条
  status: z.enum(HR_STATUSES).nullable(), // 自标状态：excluded 表示已排除，null 无标记
  lastChatAt: z.number(), // 最近一次打开该会话的时间戳（毫秒），后台落库时盖章
  firstSeenAt: z.number(), // 首次同步该 HR 的时间戳（毫秒）
  updatedAt: z.number(), // 最近同步该 HR 档案的时间戳（毫秒）
});

// 采集输入：聊天页上报的 HR 档案，自标与时间戳由后台补齐
const hrInputSchema = hrSchema.omit({
  status: true,
  lastChatAt: true,
  firstSeenAt: true,
  updatedAt: true,
});

// 拉取排除名单的应答：被排除的 HR id 数组
const excludedHrIdsResponseSchema = z.array(z.string());

// HR 信息：回复/跟进/打招呼生成的可选输入，从档案派生
const hrInfoSchema = hrSchema.pick({
  bossName: true,
  bossTitle: true,
  brandName: true,
});

// 从 schema 派生类型，保持单一事实来源
type Hr = z.infer<typeof hrSchema>;
type HrInput = z.infer<typeof hrInputSchema>;
type HrInfo = z.infer<typeof hrInfoSchema>;

export type { Hr, HrInfo, HrInput };
export {
  excludedHrIdsResponseSchema,
  HR_STATUSES,
  hrInfoSchema,
  hrInputSchema,
  hrSchema,
};
