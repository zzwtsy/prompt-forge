import { Buffer } from "node:buffer";

import { createHmac, timingSafeEqual } from "node:crypto";
import { UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
import { z } from "zod";
import env from "@/env";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";

const SAVE_DRAFT_VERSION = "v1" as const;
const DEFAULT_SAVE_DRAFT_TTL_MS = 15 * 60 * 1000;

export const PromptCallParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export type PromptCallParams = z.infer<typeof PromptCallParamsSchema>;

export const SaveDraftPayloadSchema = z.object({
  promptRunId: z.string().min(1),
  savedPromptId: z.string().min(1),
  originalPrompt: z.string().min(1),
  evaluationResult: z.string().nullable(),
  optimizedPrompt: z.string().min(1),
  evaluateModelId: z.string().nullable(),
  optimizeModelId: z.string().min(1),
  evaluateParams: PromptCallParamsSchema.nullable(),
  optimizeParams: PromptCallParamsSchema.nullable(),
  createdAt: z.string().min(1),
});

export type SaveDraftPayload = z.infer<typeof SaveDraftPayloadSchema>;

export const SignedSaveDraftSchema = z.object({
  version: z.literal(SAVE_DRAFT_VERSION),
  issuedAt: z.string().min(1),
  expiresAt: z.string().min(1),
  payload: SaveDraftPayloadSchema,
  signature: z.string().min(1),
});

export type SignedSaveDraft = z.infer<typeof SignedSaveDraftSchema>;

function toDate(input: string, errorMessage: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      AppErrorCode.SAVE_DRAFT_INVALID,
      UNPROCESSABLE_ENTITY,
      errorMessage,
    );
  }

  return date;
}

function buildSignPayload(input: Omit<SignedSaveDraft, "signature">) {
  return JSON.stringify({
    version: input.version,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    payload: input.payload,
  });
}

function signPayload(rawPayload: string) {
  return createHmac("sha256", env.PROMPT_SAVE_DRAFT_SECRET)
    .update(rawPayload)
    .digest("base64url");
}

function verifySignature(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  if (expectedBuffer.length !== actualBuffer.length)
    return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * 生成可用于“重试保存”的签名草稿。
 */
export function createSignedSaveDraft(options: {
  payload: SaveDraftPayload;
  now?: Date;
  ttlMs?: number;
}): SignedSaveDraft {
  const payload = SaveDraftPayloadSchema.parse(options.payload);
  const issuedAtTime = options.now ?? new Date();
  const ttlMs = options.ttlMs ?? DEFAULT_SAVE_DRAFT_TTL_MS;
  const issuedAt = issuedAtTime.toISOString();
  const expiresAt = new Date(issuedAtTime.getTime() + ttlMs).toISOString();

  const unsignedDraft = {
    version: SAVE_DRAFT_VERSION,
    issuedAt,
    expiresAt,
    payload,
  };

  return {
    ...unsignedDraft,
    signature: signPayload(buildSignPayload(unsignedDraft)),
  };
}

/**
 * 验证签名草稿合法性与有效期，失败时抛出 422 业务错误。
 */
export function verifySignedSaveDraft(
  input: unknown,
  now: Date = new Date(),
): SignedSaveDraft {
  const parsed = SignedSaveDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      AppErrorCode.SAVE_DRAFT_INVALID,
      UNPROCESSABLE_ENTITY,
    );
  }

  const draft = parsed.data;
  const issuedAt = toDate(draft.issuedAt, "保存草稿签发时间无效");
  const expiresAt = toDate(draft.expiresAt, "保存草稿过期时间无效");
  const payloadCreatedAt = toDate(draft.payload.createdAt, "保存草稿创建时间无效");

  if (expiresAt.getTime() <= issuedAt.getTime()) {
    throw new AppError(
      AppErrorCode.SAVE_DRAFT_INVALID,
      UNPROCESSABLE_ENTITY,
      "保存草稿时间窗口无效",
    );
  }

  if (expiresAt.getTime() <= now.getTime()) {
    throw new AppError(
      AppErrorCode.SAVE_DRAFT_INVALID,
      UNPROCESSABLE_ENTITY,
    );
  }

  const expectedSignature = signPayload(buildSignPayload({
    version: draft.version,
    issuedAt: draft.issuedAt,
    expiresAt: draft.expiresAt,
    payload: {
      ...draft.payload,
      createdAt: payloadCreatedAt.toISOString(),
    },
  }));

  if (!verifySignature(expectedSignature, draft.signature)) {
    throw new AppError(
      AppErrorCode.SAVE_DRAFT_INVALID,
      UNPROCESSABLE_ENTITY,
    );
  }

  return {
    ...draft,
    payload: {
      ...draft.payload,
      createdAt: payloadCreatedAt.toISOString(),
    },
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export const saveDraftSigningConstants = {
  SAVE_DRAFT_VERSION,
  DEFAULT_SAVE_DRAFT_TTL_MS,
} as const;
