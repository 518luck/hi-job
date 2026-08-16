// # 页面对象属性读取工具：安全访问页面私有对象（Vue 实例等）
//
// 页面对象可能带响应式代理，直接访问 getter 会抛异常，统一用 Reflect.get 包裹。

// 安全读取对象属性，读取失败返回 undefined
const readProperty = (source: unknown, key: string): unknown => {
  if (source === null || typeof source !== 'object') {
    return undefined;
  }
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
};

// 读取字符串属性，非字符串或读取失败回退空串
const stringOf = (source: unknown, key: string): string => {
  const value = readProperty(source, key);
  return typeof value === 'string' ? value.trim() : '';
};

export { readProperty, stringOf };
