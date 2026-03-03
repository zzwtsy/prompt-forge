export interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ApiEnvelopeFailure {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeFailure;

export class ApiEnvelopeError extends Error {
  public readonly code: number;
  public readonly details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiEnvelopeError";
    this.code = code;
    this.details = details;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiEnvelopeFailure(value: unknown): value is ApiEnvelopeFailure {
  if (!isObject(value)) {
    return false;
  }

  if (value.success !== false) {
    return false;
  }

  if (!isObject(value.error)) {
    return false;
  }

  return typeof value.error.code === "number" && typeof value.error.message === "string";
}

function isApiEnvelopeSuccess<T>(value: unknown): value is ApiEnvelopeSuccess<T> {
  if (!isObject(value)) {
    return false;
  }

  return value.success === true && "data" in value;
}

export function unwrapApiEnvelope<T>(value: unknown): T {
  if (isApiEnvelopeSuccess<T>(value)) {
    return value.data;
  }

  if (isApiEnvelopeFailure(value)) {
    throw new ApiEnvelopeError(value.error.code, value.error.message, value.error.details);
  }

  if (isObject(value) && "success" in value) {
    throw new Error("接口返回格式异常，请稍后重试");
  }

  // Backward-compatible passthrough: allows service calls to keep unwrap logic
  // while alova `responded` may already have unwrapped the envelope.
  return value as T;
}

export interface NormalizedClientError {
  type: "api" | "network" | "unknown";
  message: string;
  code?: number;
  details?: unknown;
}

export function normalizeClientError(error: unknown): NormalizedClientError {
  if (error instanceof ApiEnvelopeError) {
    return {
      type: "api",
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      type: "network",
      message: error.message || "网络请求失败，请稍后重试",
    };
  }

  return {
    type: "unknown",
    message: "发生未知异常，请稍后重试",
  };
}

function collectPathsFromIssues(issues: unknown[], fields: Set<string>) {
  for (const issue of issues) {
    if (!isObject(issue)) {
      continue;
    }

    const path = issue.path;
    if (!Array.isArray(path)) {
      continue;
    }

    const joined = path
      .map(segment => (typeof segment === "string" || typeof segment === "number") ? String(segment) : "")
      .filter(Boolean)
      .join(".");

    if (joined.length > 0) {
      fields.add(joined);
    }
  }
}

export function extractValidationFieldPaths(details: unknown): Set<string> {
  const fields = new Set<string>();

  if (Array.isArray(details)) {
    collectPathsFromIssues(details, fields);
    return fields;
  }

  if (!isObject(details)) {
    return fields;
  }

  if (Array.isArray(details.issues)) {
    collectPathsFromIssues(details.issues, fields);
  }

  if (isObject(details.error) && Array.isArray(details.error.issues)) {
    collectPathsFromIssues(details.error.issues, fields);
  }

  return fields;
}
