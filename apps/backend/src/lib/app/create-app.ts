import type { Schema } from "hono";

import type { AppBindings, AppOpenAPI } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";
import { serveEmojiFavicon } from "stoker/middlewares";

import { appNotFound } from "@/middlewares/app-not-found";
import { appOnError } from "@/middlewares/app-on-error";
import { pinoLogger } from "@/middlewares/pino-logger";
import { appDefaultHook } from "./default-hook";

/**
 * 创建带有统一绑定类型的 OpenAPI 路由实例。
 *
 * @returns 可继续挂载子路由的 OpenAPIHono 实例。
 */
export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: appDefaultHook,
  });
}

/**
 * 创建应用根实例并挂载全局中间件与兜底处理器。
 *
 * 注意：中间件顺序会影响请求处理链路，请避免随意调整。
 *
 * @returns 已配置默认行为的应用实例。
 */
export default function createApp() {
  const app = createRouter();
  app.use(requestId())
    .use(serveEmojiFavicon("📝"))
    .use(pinoLogger());

  app.notFound(appNotFound);
  app.onError(appOnError);
  return app;
}

/**
 * 构建测试专用应用实例。
 *
 * @param router 要挂载的路由对象。
 * @returns 挂载完成的应用实例，便于在测试中直接发起请求。
 */
export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route("/", router);
}
