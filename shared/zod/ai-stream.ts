// # ai-stream 消息：AI 流式生成的事件 DTO（后台推送信封 hiJobStream 的内层结构）
import { z } from 'zod';

// 流式请求句柄：启动消息立即返回，后续 reasoning/chunk/end/error 事件按 requestId 关联
const aiStreamHandleSchema = z.object({
  requestId: z.string().min(1), // 流式请求唯一 id
});

// 流式事件判别联合：reasoning 思考增量、chunk 正文增量、end 结束全文、error 失败原因
const aiStreamEventSchema = z.discriminatedUnion('kind', [
  z.object({
    requestId: z.string().min(1), // 关联的流式请求 id
    kind: z.literal('reasoning'), // 思考增量事件
    delta: z.string(), // 本次追加的思考文本增量
  }),
  z.object({
    requestId: z.string().min(1), // 关联的流式请求 id
    kind: z.literal('chunk'), // 正文增量事件
    delta: z.string(), // 本次追加的正文文本增量
  }),
  z.object({
    requestId: z.string().min(1), // 关联的流式请求 id
    kind: z.literal('end'), // 结束事件
    text: z.string(), // 完整生成文本（修剪后）
    usage: z
      .object({
        inputTokens: z.number().nonnegative(), // 输入 token 用量
        outputTokens: z.number().nonnegative(), // 输出 token 用量
      })
      .optional(), // 模型上报的 token 用量，供应商未上报时缺失
  }),
  z.object({
    requestId: z.string().min(1), // 关联的流式请求 id
    kind: z.literal('error'), // 失败事件
    message: z.string(), // 可展示的失败原因
  }),
]);

type AiStreamHandle = z.infer<typeof aiStreamHandleSchema>;
type AiStreamEvent = z.infer<typeof aiStreamEventSchema>;

export type { AiStreamEvent, AiStreamHandle };
export { aiStreamEventSchema, aiStreamHandleSchema };
