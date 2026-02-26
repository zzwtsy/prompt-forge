import { pinoLogger as pLogger } from "hono-pino";

import { logger } from "@/lib/logger";

/**
 * 注册基于 Pino 的请求日志中间件。
 *
 * @returns hono-pino 中间件实例。
 */
export function pinoLogger() {
  return pLogger({
    pino: logger,
  });
}
