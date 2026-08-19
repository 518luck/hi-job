// # 范围工具：截取、越界取值与进度计算的安全数值助手

// 数值钳制到 [min, max]，NaN 回退 min
export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

// 取前 count 项，count 越界时安全截断
export const take = <T>(items: readonly T[], count: number): T[] =>
  items.slice(0, Math.floor(clamp(count, 0, items.length)));

// 钳制 index 到 items 的有效下标范围
export const indexIn = <T>(items: readonly T[], index: number): number =>
  Math.floor(clamp(index, 0, Math.max(0, items.length - 1)));

// 取下标 index 处的项，越界钳制到边界，空集返回 undefined
export const at = <T>(items: readonly T[], index: number): T | undefined => {
  if (items.length === 0) return undefined;
  return items[indexIn(items, index)];
};

// value 占 total 的百分比，钳制在 0…100
export const pct = (value: number, total: number): number => {
  if (!(total > 0)) return 0;
  return clamp((value / total) * 100, 0, 100);
};

// 已完成项数：index 对 total 的进度计数，钳制在 0…total
export const progressOf = (index: number, total: number): number => {
  if (!(total > 0)) return 0;
  return Math.floor(clamp(index, 0, total));
};
