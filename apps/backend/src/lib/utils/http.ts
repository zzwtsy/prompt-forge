import type { Context, TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppBindings } from "../types";
import { z } from "@hono/zod-openapi";

/**
 * API 错误响应结构定义 (Zod Schema).
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false).openapi({ example: false }),
  error: z.object({
    code: z.number().openapi({ example: 40401 }),
    message: z.string().openapi({ example: "资源不存在" }),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional().openapi({ example: "req_123" }),
}).openapi("ApiError");

/**
 * API 错误响应的 TypeScript 类型.
 */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * 创建通用 API 成功响应结构的工厂函数.
 *
 * @param dataSchema 数据部分的 Zod Schema
 * @returns 包含 `success/data/requestId` 的 Zod 对象结构。
 */
export function createApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true).openapi({ example: true }),
    data: dataSchema,
    requestId: z.string().optional().openapi({ example: "req_123" }),
  });
}

/**
 * API 成功响应的 TypeScript 接口.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
}

/**
 * 通用 API 响应类型 (成功或错误).
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

type JsonTypedResponse<T, S extends ContentfulStatusCode> = Response & TypedResponse<T, S, "json">;

/**
 * 发送标准成功响应的辅助函数.
 *
 * @param c Hono 上下文
 * @param data 响应数据
 * @returns 状态码为 200 的 JSON 响应。
 */
export function ok<T>(c: Context<AppBindings>, data: T): JsonTypedResponse<ApiSuccess<T>, 200>;

/**
 * 发送标准成功响应的辅助函数.
 *
 * @param c Hono 上下文
 * @param data 响应数据
 * @param status HTTP 状态码
 * @returns 指定状态码的 JSON 响应。
 */
export function ok<T, S extends ContentfulStatusCode>(
  c: Context<AppBindings>,
  data: T,
  status: S,
): JsonTypedResponse<ApiSuccess<T>, S>;

/** `ok` 的实现签名。 */
export function ok<T, S extends ContentfulStatusCode>(
  c: Context<AppBindings>,
  data: T,
  status?: S,
) {
  const payload = {
    success: true,
    data,
    requestId: c.var.requestId,
  } satisfies ApiSuccess<T>;

  if (status === undefined) {
    return c.json(payload, 200);
  }

  return c.json(payload, status);
}

/**
 * 发送标准错误响应的辅助函数.
 *
 * @param c Hono 上下文
 * @param options 错误选项
 * @param options.code 错误代码
 * @param options.message 错误消息
 * @param options.details 可选的错误详情
 * @param options.status HTTP 状态码
 * @returns 标准错误结构的 JSON 响应。
 */
export function fail<S extends ContentfulStatusCode>(
  c: Context<AppBindings>,
  options: {
    code: number;
    message: string;
    details?: unknown;
    status: S;
  },
): JsonTypedResponse<ApiError, S> {
  const { code, message, details, status } = options;

  const payload = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId: c.var.requestId,
  } satisfies ApiError;

  return c.json(payload, status);
}
