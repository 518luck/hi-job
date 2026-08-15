# infra 层规范

## 定位

infra 是基础设施层，按技术域组织（存储、网络、日志等）。每个域分两层：

- **装配层**（如 `storage/db.ts`）：全局实例与注册清单。
- **领域层**（如 `storage/jd/`）：按业务领域划分的子目录，是该领域数据的完整仓储。

## 依赖规则

- infra 只可依赖 shared 与第三方库，禁止依赖业务 layer（pages / widgets / app / entrypoints）。
- 各上层均向下使用 infra，统一走域根聚合入口（如 `@/infra/storage`）。

## 结构与命名

- 域根 `index.ts` 聚合导出各领域的仓储与实体类型。
- 领域子目录两件套：仓储实现、`index.ts`（领域公有 API）。字段字典在 `shared/zod/`（一表一文件，文件名与表名一致），表索引直接写在 `db.ts` 的版本声明里。
- 装配文件集中管理实例与版本：schema 变更递增 `version` 只写增量迁移，禁止修改历史声明。
- 全部数据 schema（落库实体为基座及其派生物）放 `shared/zod/`；infra 不声明字段结构，只留仓储与版本迁移。
- 仓储以单个对象导出（如 `jdStore`），成员为读写方法并带行尾简短注释；仓储无状态，不使用类。
- 仓储接口保持稳定，更换底层实现时不动调用方。

## 存储写入链路

内容脚本运行在网页 origin 下，不能访问扩展的 IndexedDB，统一走消息：

```
content script → sendMessage → background 校验（zod）→ 仓储写入
```

界面用 `dexie-react-hooks` 的 `useLiveQuery` 订阅查询，数据变化自动重渲染。

## 当前域

| 目录 | 职责 |
| --- | --- |
| `storage/` | 存储域：聚合入口（`index.ts`）、数据库装配（`db.ts`） |
| `storage/jd/` | jd 领域：表索引 + 职位与公司记录的读写 |
| `storage/ai-vendor/` | ai-vendor 领域：表索引 + AI 厂商配置的读写 |
