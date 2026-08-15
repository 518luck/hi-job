import type { z } from 'zod';

// 拼出 local 存储区域下按冒号分层级的 key
const localKey = (...parts: string[]): `local:${string}` =>
  `local:${parts.join(':')}`;

// 固定领域前缀的 key 工厂：不同业务 slice 各自命名空间，存储 key 互不冲突
const namespacedKey =
  (namespace: string) =>
  (...parts: string[]): `local:${string}` =>
    localKey(namespace, ...parts);

// 读取单个 key 并用 schema 校验，缺失或坏数据返回 null
const readItem = async <T>({
  key,
  schema,
}: {
  key: `local:${string}`;
  schema: z.ZodType<T>;
}): Promise<T | null> => {
  const raw = await storage.getItem<unknown>(key);
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

// 按 key 列表批量读取并校验，跳过坏数据条目，保持请求顺序
const readItems = async <T>({
  keys,
  schema,
}: {
  keys: `local:${string}`[];
  schema: z.ZodType<T>;
}): Promise<T[]> => {
  const items = await storage.getItems(keys);
  return items
    .map((item) => {
      const parsed = schema.safeParse(item.value);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is T => item !== null);
};

// 批量写入一组 key-value，一次落盘
const writeItems = async (
  items: { key: `local:${string}`; value: unknown }[],
): Promise<void> => {
  await storage.setItems(items);
};

// 监听单个 key 的变化，返回取消监听函数
const watchKey = ({
  key,
  onChange,
}: {
  key: `local:${string}`;
  onChange: () => void;
}) => storage.watch(key, onChange);

export {
  localKey, // 拼 local 存储区域的层级 key
  namespacedKey, // 创建固定领域前缀的 key 工厂
  readItem, // 读单个 key 并经 schema 校验
  readItems, // 批量读取并校验，跳过坏数据
  watchKey, // 监听 key 变化，返回取消函数
  writeItems, // 批量写入一组 key-value，一次落盘
};
