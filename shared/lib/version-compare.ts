// # 语义化版本比较：点分段数值逐段比较

// 比较两个点分版本号：正数表示 a 更新，负数表示 b 更新，0 表示相同；非数字段按 0 处理
const compareVersions = (a: string, b: string): number => {
  const partsOf = (version: string): number[] =>
    version.split('.').map((part) => {
      const parsed = Number.parseInt(part, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    });
  const left = partsOf(a);
  const right = partsOf(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
};

export { compareVersions };
