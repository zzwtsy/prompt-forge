import type { z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import { ApiErrorSchema, createApiSuccessSchema } from "../utils/http";

/**
 * 生成统一成功响应的 OpenAPI `application/json` 内容定义。
 *
 * @param schema 成功响应中的 `data` 结构。
 * @param description 响应描述。
 * @returns 可直接用于 route `responses` 的内容对象。
 */
export function jsonApiContent<T extends z.ZodTypeAny>(
  schema: T,
  description: string,
) {
  return jsonContent(
    createApiSuccessSchema(schema),
    description,
  );
}

/**
 * 生成统一错误响应的 OpenAPI `application/json` 内容定义。
 *
 * @param description 响应描述。
 * @returns 错误响应内容对象。
 */
export function jsonApiError(
  description: string,
) {
  return jsonContent(
    ApiErrorSchema,
    description,
  );
}
