/** 错误码描述对象。 */
export interface ErrorDescriptor {
  code: number;
  message: string;
}

export const AppErrorCode = {
  /**
   * 系统内部错误
   * - 场景: 未捕获异常、数据库挂了、代码逻辑 bug
   * - 对应 HTTP: 500
   */
  SYSTEM_ERROR: { code: 10001, message: "System error occurred" },

  /**
   * 通用 HTTP 异常
   * - 场景: 捕获到 Hono HTTPException 时的兜底
   * - 对应 HTTP: status code
   */
  HTTP_ERROR: { code: 10002, message: "HTTP error" },

  /**
   * 参数校验失败
   * - 场景: Zod 校验不通过
   * - 对应 HTTP: 422
   */
  VALIDATION_ERROR: { code: 30001, message: "Validation failed" },

  /**
   * 资源不存在
   * - 场景: 路由 404 或 ID 查不到
   * - 对应 HTTP: 404
   */
  NOT_FOUND: { code: 40001, message: "Resource not found" },

  /**
   * 未认证
   * - 场景: 需要登录态的接口未携带或已失效
   * - 对应 HTTP: 401
   */
  UNAUTHORIZED: { code: 40101, message: "Unauthorized" },

  /**
   * 无权限
   * - 场景: 已登录但缺少访问资源所需权限
   * - 对应 HTTP: 403
   */
  FORBIDDEN: { code: 40301, message: "Forbidden" },

} as const satisfies Record<string, ErrorDescriptor>;

/** 提取 Key 的联合类型: "SYSTEM_ERROR" | "VALIDATION_ERROR" | ... */
export type AppErrorCodeKey = keyof typeof AppErrorCode;

/** 提取 Value 的联合类型 (包含具体的 code 和 message 字面量) */
export type AppErrorCodeValue = (typeof AppErrorCode)[AppErrorCodeKey];

/** 提取具体业务代码 code 的联合类型: 10001 | 30001 | ... */
export type AppCode = AppErrorCodeValue["code"];
