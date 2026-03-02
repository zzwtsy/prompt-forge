import { beforeEach, describe, expect, it, vi } from "vitest";

import createApp, { createTestApp } from "@/lib/app/create-app";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";
import { listSavedPrompts, retryPersistSavedPrompt } from "@/lib/prompt/prompt-history-service";

import router from "./saved-prompts.index";

vi.mock("@/lib/prompt/prompt-history-service", () => ({
  listSavedPrompts: vi.fn(),
  retryPersistSavedPrompt: vi.fn(),
}));

function createAuthedApp() {
  const app = createApp();
  app.use("*", async (c: any, next: any) => {
    c.set("user", { id: "u_saved" } as any);
    c.set("session", { id: "s_saved" } as any);
    await next();
  });
  app.route("/", router);
  return app;
}

async function parseBody(response: Response) {
  return await response.json() as {
    success: boolean;
    data?: any;
    error?: {
      code: number;
      message: string;
    };
  };
}

describe("saved-prompts routes", () => {
  const mockedListSavedPrompts = vi.mocked(listSavedPrompts);
  const mockedRetryPersistSavedPrompt = vi.mocked(retryPersistSavedPrompt);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous saved prompts list requests", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/saved-prompts");
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.UNAUTHORIZED.code);
  });

  it("returns saved prompts page without original prompt fields", async () => {
    mockedListSavedPrompts.mockResolvedValue({
      items: [
        {
          id: "saved_1",
          promptRunId: "run_1",
          optimizedPrompt: "优化后提示词 A",
          createdAt: "2026-03-02T00:00:00.000Z",
        },
      ],
      nextCursor: "cursor_1",
    });

    const app = createAuthedApp();
    const response = await app.request("/api/saved-prompts?limit=20");
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(mockedListSavedPrompts).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
    });
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      items: [
        {
          id: "saved_1",
          promptRunId: "run_1",
          optimizedPrompt: "优化后提示词 A",
          createdAt: "2026-03-02T00:00:00.000Z",
        },
      ],
      nextCursor: "cursor_1",
    });
    expect(body.data.items[0]?.originalPrompt).toBeUndefined();
  });

  it("supports cursor paging request", async () => {
    mockedListSavedPrompts.mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const app = createAuthedApp();
    const response = await app.request("/api/saved-prompts?limit=10&cursor=cursor_abc");
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockedListSavedPrompts).toHaveBeenCalledWith({
      limit: 10,
      cursor: "cursor_abc",
    });
  });

  it("rejects anonymous retry requests", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/saved-prompts/retry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        saveDraft: {},
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.UNAUTHORIZED.code);
  });

  it("returns 422 when retry draft is invalid", async () => {
    mockedRetryPersistSavedPrompt.mockRejectedValue(
      new AppError(
        AppErrorCode.SAVE_DRAFT_INVALID,
        422,
      ),
    );

    const app = createAuthedApp();
    const response = await app.request("/api/saved-prompts/retry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        saveDraft: {
          version: "v1",
          issuedAt: "2026-03-02T00:00:00.000Z",
          expiresAt: "2026-03-02T00:15:00.000Z",
          payload: {
            promptRunId: "run_1",
            savedPromptId: "saved_1",
            originalPrompt: "原始提示词",
            evaluationResult: null,
            optimizedPrompt: "优化后",
            evaluateModelId: null,
            optimizeModelId: "m_1",
            evaluateParams: null,
            optimizeParams: null,
            createdAt: "2026-03-02T00:00:00.000Z",
          },
          signature: "bad",
        },
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.SAVE_DRAFT_INVALID.code);
  });

  it("is idempotent when retrying the same save draft", async () => {
    mockedRetryPersistSavedPrompt.mockResolvedValue({
      promptRunId: "run_same",
      savedPromptId: "saved_same",
      saved: true,
    });

    const app = createAuthedApp();
    const payload = {
      saveDraft: {
        version: "v1",
        issuedAt: "2026-03-02T00:00:00.000Z",
        expiresAt: "2026-03-02T00:15:00.000Z",
        payload: {
          promptRunId: "run_same",
          savedPromptId: "saved_same",
          originalPrompt: "原始提示词",
          evaluationResult: null,
          optimizedPrompt: "优化后",
          evaluateModelId: null,
          optimizeModelId: "m_1",
          evaluateParams: null,
          optimizeParams: null,
          createdAt: "2026-03-02T00:00:00.000Z",
        },
        signature: "sig",
      },
    };

    const firstResponse = await app.request("/api/saved-prompts/retry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const secondResponse = await app.request("/api/saved-prompts/retry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const firstBody = await parseBody(firstResponse);
    const secondBody = await parseBody(secondResponse);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody.data).toEqual({
      promptRunId: "run_same",
      savedPromptId: "saved_same",
      saved: true,
    });
    expect(secondBody.data).toEqual({
      promptRunId: "run_same",
      savedPromptId: "saved_same",
      saved: true,
    });
  });
});
