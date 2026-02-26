import type { ContentfulStatusCode } from "hono/utils/http-status";

/** 业务错误描述结构。 */
export interface ErrorDescriptor {
  code: number;
  message: string;
}

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
   * @param message 可选覆盖消息。
   * @param status HTTP 状态码，默认 400。
   * @param details 结构化错误详情（用于日志或调试）。
   */
  constructor(
    descriptor: ErrorDescriptor,
    message?: string,
    status: ContentfulStatusCode = 400,
    details?: unknown,
  ) {
    super(message ?? descriptor.message);
    this.name = "AppError";
    this.code = descriptor.code;
    this.status = status;
    this.details = details;
  }
}
