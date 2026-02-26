import type { ErrorHandler } from "hono";
import type { AppBindings } from "@/lib/types";

import { HTTPException } from "hono/http-exception";
import { INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes";
import env from "@/env";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";
import { fail } from "@/lib/utils/http";

/**
 * 全局错误处理中间件。
 *
 * @param err 捕获到的异常对象，可能来自业务代码、框架或第三方库。
 * @param c 当前请求上下文。
 * @returns 标准化错误响应。
 */
export const appOnError: ErrorHandler<AppBindings> = (err, c) => {
  const currentStatus = "status" in err ? err.status : c.newResponse(null).status;
  // 注意：部分异常默认 status 可能是 200，这里统一纠正为 500，避免错误被误报为成功。
  const statusCode = currentStatus !== OK ? (currentStatus as any) : INTERNAL_SERVER_ERROR;

  c.var.logger.error({
    err,
    requestId: c.var.requestId,
    path: c.req.path,
    method: c.req.method,
    status: statusCode,
  }, "Unhandled error");

  if (err instanceof AppError) {
    return fail(c, {
      code: err.code,
      message: err.message,
      status: err.status,
      details: err.details,
    });
  }

  if (err instanceof HTTPException) {
    return fail(c, {
      code: AppErrorCode.HTTP_ERROR.code,
      message: err.message,
      status: err.status,
    });
  }

  return fail(c, {
    code: AppErrorCode.SYSTEM_ERROR.code,
    message: statusCode === INTERNAL_SERVER_ERROR ? AppErrorCode.SYSTEM_ERROR.message : err.message,
    status: statusCode,
    // 注意：仅开发环境返回堆栈，避免生产环境泄露内部实现细节。
    details: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
