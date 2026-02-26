import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";
import type { AuthSession } from "./auth/instance";

/** 应用级 Hono 绑定类型定义。 */
export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: AuthSession["user"] | null;
    session: AuthSession["session"] | null;
  };
};

/** 应用统一 OpenAPIHono 类型别名。 */
// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

/** 绑定应用上下文类型后的路由处理器别名。 */
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
