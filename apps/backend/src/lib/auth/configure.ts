import type { AppOpenAPI } from "../types";
import { auth } from "@/lib/auth/instance";
import { authContext } from "@/middlewares/auth-context";

/**
 * 挂载 Better Auth 相关中间件与路由。
 *
 * @param app 应用实例。
 */
export default function configureAuth(app: AppOpenAPI) {
  // 1. 注册认证上下文中间件
  app.use("*", authContext);

  // 2. 注册 Better Auth 的 API 路由
  app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw));
}
