// # update-check 表数据字典：远端版本检查缓存、协议 DTO 与外源响应契约
import { z } from 'zod';

// 单行固定主键：版本检查缓存只有一份，key 恒为 global
const UPDATE_CHECK_KEY = 'global';

// 表 updateCheck（版本检查缓存）落库实体：主键 key
const updateCheckSchema = z.object({
  key: z.literal(UPDATE_CHECK_KEY), // 单行固定主键
  lastCheckedAt: z.number(), // 上次检查的时间戳（ms），距今不足 TTL 时直接用缓存
  latestVersion: z.string().nullable(), // 远端最新版本号（已去 v 前缀），全部失败时为 null
  releaseUrl: z.string().nullable(), // 最新 release 页链接，镜像源取不到时为 null
  source: z.enum(['github', 'jsdelivr', 'unknown']), // 本次结果来源端点
});

// 协议返回的检查状态：去掉存储主键，附加本地动态字段
const updateCheckStatusSchema = updateCheckSchema.omit({ key: true }).extend({
  currentVersion: z.string(), // 当前安装版本（读 manifest）
  hasUpdate: z.boolean(), // 远端版本是否高于当前版本
});

// GitHub Releases latest 接口响应的最小字段集（外源响应契约）
const githubReleaseResponseSchema = z.object({
  tag_name: z.string(), // 最新 Release 的 tag（约定 v 前缀 + 版本号）
  html_url: z.string(), // Release 页链接
});

// jsDelivr package.json 响应的最小字段集（外源响应契约）
const jsdelivrPackageResponseSchema = z.object({
  version: z.string(), // main 分支 package.json 的版本号
});

// 从 schema 派生类型，保持单一事实来源
type UpdateCheck = z.infer<typeof updateCheckSchema>;
type UpdateCheckStatus = z.infer<typeof updateCheckStatusSchema>;

export type { UpdateCheck, UpdateCheckStatus };
export {
  UPDATE_CHECK_KEY,
  githubReleaseResponseSchema,
  jsdelivrPackageResponseSchema,
  updateCheckSchema,
  updateCheckStatusSchema,
};
