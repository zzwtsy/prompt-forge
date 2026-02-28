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
   * - details 对外: 否（仅开发环境可返回堆栈）
   */
  SYSTEM_ERROR: { code: 10001, message: "系统内部错误" },

  /**
   * 通用 HTTP 异常
   * - 场景: 捕获到 Hono HTTPException 时的兜底
   * - 对应 HTTP: status code
   * - details 对外: 否
   */
  HTTP_ERROR: { code: 10002, message: "HTTP 异常" },

  /**
   * 参数校验失败
   * - 场景: Zod 校验不通过
   * - 对应 HTTP: 422
   * - details 对外: 是（仅返回字段级校验错误）
   */
  VALIDATION_ERROR: { code: 30001, message: "请求参数校验失败" },

  /**
   * 资源不存在
   * - 场景: 路由 404 或 ID 查不到
   * - 对应 HTTP: 404
   * - details 对外: 是（可返回请求路径与方法）
   */
  NOT_FOUND: { code: 40401, message: "资源不存在" },

  /**
   * 未认证
   * - 场景: 需要登录态的接口未携带或已失效
   * - 对应 HTTP: 401
   * - details 对外: 否
   */
  UNAUTHORIZED: { code: 40101, message: "未认证或登录失效" },

  /**
   * 无权限
   * - 场景: 已登录但缺少访问资源所需权限
   * - 对应 HTTP: 403
   * - details 对外: 否
   */
  FORBIDDEN: { code: 40301, message: "无权限访问" },

  /**
   * 服务商未启用
   * - 场景: 运行时解析模型时 provider.enabled = false
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  PROVIDER_DISABLED: { code: 22001, message: "服务商已禁用" },

  /**
   * 模型未启用
   * - 场景: 运行时解析模型时 model.enabled = false
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  MODEL_DISABLED: { code: 22002, message: "模型已禁用" },

  /**
   * 默认模型未设置
   * - 场景: 评估/优化请求未显式指定 modelId 且默认模型为空
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  DEFAULT_MODEL_NOT_SET: { code: 22003, message: "默认模型未设置" },

  /**
   * 默认模型不可用
   * - 场景: 默认模型不存在、状态非法或关联配置损坏
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  DEFAULT_MODEL_INVALID: { code: 22004, message: "默认模型不可用，请先修复模型设置" },

  /**
   * 服务商 API Key 缺失
   * - 场景: 运行时调用或模型同步前未配置 API Key
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  PROVIDER_API_KEY_MISSING: { code: 22005, message: "服务商 API Key 未配置" },

  /**
   * 模型冲突
   * - 场景: 手动新增模型时命中 providerId+modelName 唯一约束
   * - 对应 HTTP: 422
   * - details 对外: 否
   */
  MODEL_CONFLICT: { code: 22006, message: "模型已存在，不能重复创建" },

  /**
   * 服务商不存在
   * - 场景: 通过 providerId 查询失败
   * - 对应 HTTP: 404
   * - details 对外: 否
   */
  PROVIDER_NOT_FOUND: { code: 42001, message: "服务商不存在" },

  /**
   * 模型不存在
   * - 场景: 通过 modelId 查询失败
   * - 对应 HTTP: 404
   * - details 对外: 否
   */
  MODEL_NOT_FOUND: { code: 42002, message: "模型不存在" },

  /**
   * 模型同步失败
   * - 场景: 拉取上游模型列表时外部请求失败
   * - 对应 HTTP: 502
   * - details 对外: 否
   */
  MODEL_SYNC_FAILED: { code: 52001, message: "模型同步失败，请稍后重试" },

} as const satisfies Record<string, ErrorDescriptor>;

/** 提取 Key 的联合类型: "SYSTEM_ERROR" | "VALIDATION_ERROR" | ... */
export type AppErrorCodeKey = keyof typeof AppErrorCode;

/** 提取 Value 的联合类型 (包含具体的 code 和 message 字面量) */
export type AppErrorCodeValue = (typeof AppErrorCode)[AppErrorCodeKey];

/** 提取具体业务代码 code 的联合类型: 10001 | 30001 | ... */
export type AppCode = AppErrorCodeValue["code"];
