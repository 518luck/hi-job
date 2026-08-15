# infra 层规范

## 定位

infra 是基础设施层，按技术域（存储、网络、日志等）组织，每个域内分两层：

- **原语层**（如 `storage/lib/kv.ts`）：业务无关的能力封装，回答"怎么存/怎么连"。
- **领域仓储层**（如 `storage/jd/`）：按业务领域划分的子目录，是该领域数据的完整仓储——key 布局、schema 绑定、读写与聚合规则都封装在领域目录内。

## 依赖规则

- infra 只可依赖 shared（如 `@/shared/zod` 的 schema），禁止依赖业务 layer（pages / widgets / app / entrypoints）。
- 上层（shared、widgets、pages、app/entrypoints）均可向下导入 infra，统一走各域的聚合入口（如 `@/infra/storage`）。
- 原语层保持业务无关；业务语义只允许出现在领域仓储目录内。

## 结构与命名

- 先按技术域分目录（`storage/` 等），域下建 `lib/` 放业务无关原语。
- 域根的 `index.ts` 聚合导出各领域仓储，上层统一从 `@/infra/storage` 导入；各领域目录的 `index.ts` 供域根聚合使用。lib 原语是域内部实现，领域仓储之间以相对路径（`../lib/kv`）复用，不暴露给上层。
- 每个业务领域在域下建独立子目录（如 `storage/jd/`），以 `index.ts` 作为该领域仓储的公有 API。
- 领域仓储以单个对象导出（如 `jdStore`），成员为该领域的读写方法；仓储无实例状态，不使用类。
- 文件按作用用 kebab-case 命名（如 `kv.ts`、`jd-store.ts`）。
- 仓储导出稳定的读写接口，隐藏实现细节；底层更换（如 storage 换 SQLite）时接口保持不变。

## 存储域的 key 命名空间

领域仓储的 key 必须以领域名为第一段命名空间，统一通过 `namespacedKey('<领域>')` 创建 key 工厂：

```ts
const key = namespacedKey('jd');
key('job', jobId); // local:jd:job:<jobId>
```

不同领域的存储 key 因此天然隔离，互不冲突；`local:` 下不允许出现无命名空间前缀的业务 key。

## 当前域

| 目录 | 职责 |
| --- | --- |
| `storage/`（域根） | 聚合导出各领域仓储（`index.ts`） |
| `storage/lib/` | kv 原语（域内部实现，不对外）：key 工厂、zod 校验读写、批量写入、变更监听 |
| `storage/jd/` | jd 领域仓储：职位明细、公司聚合与索引的读写 |
