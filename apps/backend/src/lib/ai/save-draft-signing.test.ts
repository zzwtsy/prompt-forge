import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";
import {
  createSignedSaveDraft,
  saveDraftSigningConstants,
  verifySignedSaveDraft,
} from "./save-draft-signing";

function createPayload() {
  return {
    promptRunId: "run_1",
    savedPromptId: "saved_1",
    originalPrompt: "原始提示词",
    evaluationResult: "评估结果",
    optimizedPrompt: "优化后提示词",
    evaluateModelId: "model_evaluate_1",
    optimizeModelId: "model_optimize_1",
    evaluateParams: {
      temperature: 0.2,
      maxTokens: 256,
    },
    optimizeParams: {
      temperature: 0.4,
    },
    createdAt: "2026-03-02T00:00:00.000Z",
  } as const;
}

describe("save-draft-signing", () => {
  it("creates and verifies a signed save draft", () => {
    const now = new Date("2026-03-02T00:00:00.000Z");
    const draft = createSignedSaveDraft({
      payload: createPayload(),
      now,
      ttlMs: saveDraftSigningConstants.DEFAULT_SAVE_DRAFT_TTL_MS,
    });

    const verified = verifySignedSaveDraft(
      draft,
      new Date("2026-03-02T00:10:00.000Z"),
    );

    expect(verified.version).toBe("v1");
    expect(verified.payload.promptRunId).toBe("run_1");
    expect(verified.payload.optimizedPrompt).toBe("优化后提示词");
  });

  it("rejects tampered drafts", () => {
    const draft = createSignedSaveDraft({
      payload: createPayload(),
      now: new Date("2026-03-02T00:00:00.000Z"),
      ttlMs: 15 * 60 * 1000,
    });

    const tamperedDraft = {
      ...draft,
      payload: {
        ...draft.payload,
        optimizedPrompt: "我被篡改了",
      },
    };

    expect(() => verifySignedSaveDraft(
      tamperedDraft,
      new Date("2026-03-02T00:05:00.000Z"),
    )).toThrow(AppError);

    expect(() => verifySignedSaveDraft(
      tamperedDraft,
      new Date("2026-03-02T00:05:00.000Z"),
    )).toThrowError(expect.objectContaining({
      code: AppErrorCode.SAVE_DRAFT_INVALID.code,
    }));
  });

  it("rejects expired drafts", () => {
    const draft = createSignedSaveDraft({
      payload: createPayload(),
      now: new Date("2026-03-02T00:00:00.000Z"),
      ttlMs: 60 * 1000,
    });

    expect(() => verifySignedSaveDraft(
      draft,
      new Date("2026-03-02T00:02:00.000Z"),
    )).toThrowError(expect.objectContaining({
      code: AppErrorCode.SAVE_DRAFT_INVALID.code,
    }));
  });
});
