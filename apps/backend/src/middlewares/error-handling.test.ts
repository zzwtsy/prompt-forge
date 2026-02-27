import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";
import { describe, expect, it, vi } from "vitest";
import { createRouter } from "@/lib/app/create-app";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";
import { jsonApiContent, jsonApiError } from "@/lib/openapi/helpers";
import { ok } from "@/lib/utils/http";
import { appNotFound } from "./app-not-found";
import { appOnError } from "./app-on-error";
import { requireAuth } from "./require-permission";

vi.mock("@/env", () => ({
  default: {
    NODE_ENV: "test",
  },
}));

interface ErrorResponsePayload {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}

function createErrorTestApp() {
  const app = createRouter();

  app.use("*", async (c, next) => {
    c.set("logger", {
      error: vi.fn(),
      warn: vi.fn(),
    } as any);
    c.set("user", null);
    c.set("session", null);
    await next();
  });

  app.notFound(appNotFound);
  app.onError(appOnError);

  return app;
}

async function parseErrorResponse(response: Response): Promise<ErrorResponsePayload> {
  return await response.json() as ErrorResponsePayload;
}

describe("error handling chain", () => {
  it("returns 404 + 40401 for non-existing routes", async () => {
    const app = createErrorTestApp();

    const response = await app.request("/missing");
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(NOT_FOUND);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(AppErrorCode.NOT_FOUND.code);
    expect(body.error.message).toBe(AppErrorCode.NOT_FOUND.message);
  });

  it("returns 401 + 40101 when requireAuth rejects anonymous requests", async () => {
    const app = createErrorTestApp();
    app.get("/protected", requireAuth(), c => ok(c, { ok: true }));

    const response = await app.request("/protected");
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(UNAUTHORIZED);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(AppErrorCode.UNAUTHORIZED.code);
    expect(body.error.message).toBe(AppErrorCode.UNAUTHORIZED.message);
  });

  it("returns 422 + 30001 on request validation errors", async () => {
    const app = createErrorTestApp();

    const validateRoute = createRoute({
      path: "/validate",
      method: "post",
      request: {
        body: jsonContentRequired(
          z.object({
            name: z.string().min(1),
          }),
          "校验请求体",
        ),
      },
      responses: {
        [OK]: jsonApiContent(
          z.object({
            ok: z.literal(true),
          }),
          "校验通过",
        ),
        [UNPROCESSABLE_ENTITY]: jsonApiError("请求参数校验失败"),
      },
    });

    app.openapi(validateRoute, c => ok(c, { ok: true }));

    const response = await app.request("/validate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "" }),
    });
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(UNPROCESSABLE_ENTITY);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(AppErrorCode.VALIDATION_ERROR.code);
    expect(body.error.message).toBe(AppErrorCode.VALIDATION_ERROR.message);
  });

  it("maps HTTPException status codes to normalized business codes/messages", async () => {
    const app = createErrorTestApp();

    app.get("/forbidden", () => {
      throw new HTTPException(FORBIDDEN, { message: "raw forbidden message" });
    });
    app.get("/not-found", () => {
      throw new HTTPException(NOT_FOUND, { message: "raw not-found message" });
    });

    const forbiddenResponse = await app.request("/forbidden");
    const forbiddenBody = await parseErrorResponse(forbiddenResponse);
    expect(forbiddenResponse.status).toBe(FORBIDDEN);
    expect(forbiddenBody.error.code).toBe(AppErrorCode.FORBIDDEN.code);
    expect(forbiddenBody.error.message).toBe(AppErrorCode.FORBIDDEN.message);

    const notFoundResponse = await app.request("/not-found");
    const notFoundBody = await parseErrorResponse(notFoundResponse);
    expect(notFoundResponse.status).toBe(NOT_FOUND);
    expect(notFoundBody.error.code).toBe(AppErrorCode.NOT_FOUND.code);
    expect(notFoundBody.error.message).toBe(AppErrorCode.NOT_FOUND.message);
  });

  it("maps non-HTTPException errors with status to normalized business codes/messages", async () => {
    const app = createErrorTestApp();

    app.get("/status-404", () => {
      const error = new Error("raw status error") as Error & { status: number };
      error.status = NOT_FOUND;
      throw error;
    });

    const response = await app.request("/status-404");
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(NOT_FOUND);
    expect(body.error.code).toBe(AppErrorCode.NOT_FOUND.code);
    expect(body.error.message).toBe(AppErrorCode.NOT_FOUND.message);
  });

  it("returns 500 + 10001 for plain unhandled errors", async () => {
    const app = createErrorTestApp();

    app.get("/boom", () => {
      throw new Error("boom");
    });

    const response = await app.request("/boom");
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(INTERNAL_SERVER_ERROR);
    expect(body.error.code).toBe(AppErrorCode.SYSTEM_ERROR.code);
    expect(body.error.message).toBe(AppErrorCode.SYSTEM_ERROR.message);
    expect(body.error.details).toBeUndefined();
  });

  it("keeps AppError code/status/message/details unchanged", async () => {
    const app = createErrorTestApp();
    const details = { reason: "manual-check" };

    app.get("/app-error", () => {
      throw new AppError(
        AppErrorCode.FORBIDDEN,
        FORBIDDEN,
        "自定义无权限提示",
        details,
      );
    });

    const response = await app.request("/app-error");
    const body = await parseErrorResponse(response);

    expect(response.status).toBe(FORBIDDEN);
    expect(body.error.code).toBe(AppErrorCode.FORBIDDEN.code);
    expect(body.error.message).toBe("自定义无权限提示");
    expect(body.error.details).toEqual(details);
  });
});
