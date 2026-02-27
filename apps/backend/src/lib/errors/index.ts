import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ErrorDescriptor } from "./codes";

/**
 * 应用统一业务错误类型。
 *
 * 注意：`status` 为返回给客户端的 HTTP 状态码，不应直接替代日志告警级别判断。
 */
export class AppError extends Error {
  public readonly code: number;
  public readonly status: ContentfulStatusCode;
  public readonly details?: unknown;

  /**
   * @param descriptor 错误码与默认文案。
   * @param status HTTP 状态码（必填，不从 `code` 反推）。
   * @param message 可选覆盖消息。
   * @param details 结构化错误详情（用于日志或调试）。
   */
  constructor(
    descriptor: ErrorDescriptor,
    status: ContentfulStatusCode,
    message?: string,
    details?: unknown,
  ) {
    super(message ?? descriptor.message);
    this.name = "AppError";
    this.code = descriptor.code;
    this.status = status;
    this.details = details;
  }
}
