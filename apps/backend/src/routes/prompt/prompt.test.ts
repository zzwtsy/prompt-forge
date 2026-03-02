import { generateText } from "ai";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveRuntimeModel } from "@/lib/ai/model-resolver";
import createApp, { createTestApp } from "@/lib/app/create-app";
import { AppErrorCode } from "@/lib/errors/codes";
import { persistPromptHistory } from "@/lib/prompt/prompt-history-service";

import router from "./prompt.index";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/lib/ai/model-resolver", () => ({
  resolveRuntimeModel: vi.fn(),
}));

vi.mock("@/lib/prompt/prompt-history-service", () => ({
  persistPromptHistory: vi.fn(),
}));

function createAuthedApp() {
  const app = createApp();
  app.use("*", async (c: any, next: any) => {
    c.set("user", { id: "u_prompt" } as any);
    c.set("session", { id: "s_prompt" } as any);
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

describe("prompt routes", () => {
  const mockedGenerateText = vi.mocked(generateText);
  const mockedResolveRuntimeModel = vi.mocked(resolveRuntimeModel);
  const mockedPersistPromptHistory = vi.mocked(persistPromptHistory);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPersistPromptHistory.mockResolvedValue({
      promptRunId: "run_default",
      savedPromptId: "saved_default",
      saved: true,
      retryable: false,
    });
  });

  it("rejects anonymous prompt evaluate requests", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/prompt/evaluate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: "test",
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.UNAUTHORIZED.code);
  });

  it("uses explicit modelId for evaluate and maps maxTokens to maxOutputTokens", async () => {
    const resolved = {
      model: { id: "mock-model" } as any,
      resolvedModel: {
        providerId: "p1",
        providerKind: "openai" as const,
        modelId: "m-explicit",
        modelName: "gpt-4o-mini",
      },
    };
    mockedResolveRuntimeModel.mockResolvedValue(resolved);
    mockedGenerateText.mockResolvedValue({
      text: "评估结果文本",
    } as any);

    const app = createAuthedApp();
    const response = await app.request("/api/prompt/evaluate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: "请评估这个提示词",
        modelId: "m-explicit",
        temperature: 0.6,
        maxTokens: 256,
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(mockedResolveRuntimeModel).toHaveBeenCalledWith({
      purpose: "evaluate",
      modelId: "m-explicit",
    });
    expect(mockedGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      model: resolved.model,
      temperature: 0.6,
      maxOutputTokens: 256,
    }));
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      evaluationResult: "评估结果文本",
      resolvedModel: resolved.resolvedModel,
    });
  });

  it("supports optimize with optional evaluationResult", async () => {
    const resolved = {
      model: { id: "mock-model-optimize" } as any,
      resolvedModel: {
        providerId: "p1",
        providerKind: "openai-compatible" as const,
        modelId: "m-default",
        modelName: "llama-3",
      },
    };
    mockedResolveRuntimeModel.mockResolvedValue(resolved);
    mockedGenerateText.mockResolvedValue({
      text: "优化后的提示词",
    } as any);
    mockedPersistPromptHistory.mockResolvedValue({
      promptRunId: "run_1",
      savedPromptId: "saved_1",
      saved: true,
      retryable: false,
    });

    const app = createAuthedApp();
    const response = await app.request("/api/prompt/optimize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: "请优化这个提示词",
        evaluationResult: "主要问题：目标不清晰",
        evaluateContext: {
          modelId: "m-evaluate",
          temperature: 0.3,
          maxTokens: 180,
        },
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(mockedResolveRuntimeModel).toHaveBeenCalledWith({
      purpose: "optimize",
      modelId: undefined,
    });
    expect(mockedGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      model: resolved.model,
    }));
    expect(mockedPersistPromptHistory).toHaveBeenCalledWith({
      originalPrompt: "请优化这个提示词",
      evaluationResult: "主要问题：目标不清晰",
      optimizedPrompt: "优化后的提示词",
      evaluateModelId: "m-evaluate",
      optimizeModelId: "m-default",
      evaluateParams: {
        temperature: 0.3,
        maxTokens: 180,
      },
      optimizeParams: null,
    });
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      optimizedPrompt: "优化后的提示词",
      resolvedModel: resolved.resolvedModel,
      promptRunId: "run_1",
      savedPromptId: "saved_1",
      persistence: {
        saved: true,
        retryable: false,
      },
    });
  });

  it("returns saveDraft when optimize persistence fails", async () => {
    const resolved = {
      model: { id: "mock-model-optimize" } as any,
      resolvedModel: {
        providerId: "p1",
        providerKind: "openai-compatible" as const,
        modelId: "m-default",
        modelName: "llama-3",
      },
    };
    mockedResolveRuntimeModel.mockResolvedValue(resolved);
    mockedGenerateText.mockResolvedValue({
      text: "优化后的提示词",
    } as any);
    mockedPersistPromptHistory.mockResolvedValue({
      promptRunId: "run_retry",
      savedPromptId: "saved_retry",
      saved: false,
      retryable: true,
      saveDraft: {
        version: "v1",
        issuedAt: "2026-03-02T00:00:00.000Z",
        expiresAt: "2026-03-02T00:15:00.000Z",
        payload: {
          promptRunId: "run_retry",
          savedPromptId: "saved_retry",
          originalPrompt: "请优化这个提示词",
          evaluationResult: null,
          optimizedPrompt: "优化后的提示词",
          evaluateModelId: null,
          optimizeModelId: "m-default",
          evaluateParams: null,
          optimizeParams: null,
          createdAt: "2026-03-02T00:00:00.000Z",
        },
        signature: "sig",
      },
    });

    const app = createAuthedApp();
    const response = await app.request("/api/prompt/optimize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: "请优化这个提示词",
      }),
    });
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      optimizedPrompt: "优化后的提示词",
      resolvedModel: resolved.resolvedModel,
      promptRunId: "run_retry",
      savedPromptId: "saved_retry",
      persistence: {
        saved: false,
        retryable: true,
        saveDraft: {
          version: "v1",
          issuedAt: "2026-03-02T00:00:00.000Z",
          expiresAt: "2026-03-02T00:15:00.000Z",
          payload: {
            promptRunId: "run_retry",
            savedPromptId: "saved_retry",
            originalPrompt: "请优化这个提示词",
            evaluationResult: null,
            optimizedPrompt: "优化后的提示词",
            evaluateModelId: null,
            optimizeModelId: "m-default",
            evaluateParams: null,
            optimizeParams: null,
            createdAt: "2026-03-02T00:00:00.000Z",
          },
          signature: "sig",
        },
      },
    });
  });
});
