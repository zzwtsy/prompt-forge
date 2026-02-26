import type { Hook } from "@hono/zod-openapi";
import type { AppBindings } from "@/lib/types";

import { UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
import { fail } from "@/lib/utils/http";
import { AppErrorCode } from "../errors/codes";

/**
 * Zod OpenAPI 默认校验钩子。
 *
 * @param result 路由入参校验结果。
 * @param c Hono 上下文对象。
 * @returns 当校验失败时返回标准化 422 响应；校验成功时返回 `undefined` 继续后续处理。
 */
export const appDefaultHook: Hook<any, AppBindings, any, any> = (result, c) => {
  if (!result.success) {
    c.var.logger.warn({
      issues: result.error.issues,
    }, "Validation failed");

    return fail(c, {
      code: AppErrorCode.VALIDATION_ERROR.code,
      message: AppErrorCode.VALIDATION_ERROR.message,
      status: UNPROCESSABLE_ENTITY,
      details: result.error.issues,
    });
  }
};
