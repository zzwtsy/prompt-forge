import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "@/lib/types";

import { auth } from "@/lib/auth/instance";

/**
 * 认证上下文中间件。
 *
 * @param c 当前请求上下文。
 * @param next 后续中间件回调。
 * @returns 认证信息写入上下文后的执行结果。
 *
 * 注意：该中间件本身不拦截请求；是否要求登录/权限由路由级中间件决定。
 */
export const authContext: MiddlewareHandler<AppBindings> = async (c, next) => {
  // Better Auth 会从请求头( Cookie/Authorization 等)里解析出当前会话
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    // 未登录：显式置空上下文变量并放行, 后续由 requireAuth/requirePermission 决定是否拒绝
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
};
