import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "@/lib/types";
import { UNAUTHORIZED } from "stoker/http-status-codes";
import { AppErrorCode } from "@/lib/errors/codes";
import { fail } from "@/lib/utils/http";

/**
 * 路由级认证保护。
 *
 * @returns 一个会在未登录时返回 401 的中间件。
 *
 * 注意：该中间件依赖 `authContext` 先行写入 `c.var.user/session`。
 */
export function requireAuth(): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const user = c.var.user;
    const session = c.var.session;
    if (user == null || session == null) {
      return fail(c, {
        code: AppErrorCode.UNAUTHORIZED.code,
        message: AppErrorCode.UNAUTHORIZED.message,
        status: UNAUTHORIZED,
      });
    }
    await next();
  };
}
