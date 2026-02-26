import type { NotFoundHandler } from "hono";
import type { AppBindings } from "@/lib/types";

import { NOT_FOUND } from "stoker/http-status-codes";
import { AppErrorCode } from "@/lib/errors/codes";
import { fail } from "@/lib/utils/http";

/**
 * 全局 404 处理器。
 *
 * @param c 当前请求上下文。
 * @returns 包含请求路径与方法的标准化 404 响应。
 */
export const appNotFound: NotFoundHandler<AppBindings> = (c) => {
  return fail(c, {
    code: AppErrorCode.NOT_FOUND.code,
    message: AppErrorCode.NOT_FOUND.message,
    status: NOT_FOUND,
    details: {
      path: c.req.path,
      method: c.req.method,
    },
  });
};
