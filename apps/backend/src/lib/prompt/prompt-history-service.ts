import type { PromptCallParams, SignedSaveDraft } from "@/lib/ai/save-draft-signing";

import { Buffer } from "node:buffer";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
import db from "@/db";
import { promptRuns } from "@/db/schemas/prompt-run-schema";
import { savedPrompts } from "@/db/schemas/saved-prompt-schema";
import { createSignedSaveDraft, verifySignedSaveDraft } from "@/lib/ai/save-draft-signing";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";

const SAVED_PROMPTS_DEFAULT_LIMIT = 20;
const SAVED_PROMPTS_MAX_LIMIT = 50;

interface SavedPromptCursorPayload {
  createdAtMs: number;
  id: string;
}

export interface PersistPromptHistoryInput {
  originalPrompt: string;
  evaluationResult: string | null;
  optimizedPrompt: string;
  evaluateModelId: string | null;
  optimizeModelId: string;
  evaluateParams: PromptCallParams | null;
  optimizeParams: PromptCallParams | null;
}

export interface PersistPromptHistoryResult {
  promptRunId: string;
  savedPromptId: string;
  saved: boolean;
  retryable: boolean;
  saveDraft?: SignedSaveDraft;
}

export interface SavedPromptListItem {
  id: string;
  promptRunId: string;
  optimizedPrompt: string;
  createdAt: string;
}

export interface ListSavedPromptsResult {
  items: SavedPromptListItem[];
  nextCursor: string | null;
}

function buildInvalidCursorError() {
  return new AppError(
    AppErrorCode.VALIDATION_ERROR,
    UNPROCESSABLE_ENTITY,
    "cursor 参数格式无效",
  );
}

function encodeCursor(payload: SavedPromptCursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): SavedPromptCursorPayload {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const rawPayload = JSON.parse(json) as Partial<SavedPromptCursorPayload>;
    if (
      typeof rawPayload.createdAtMs !== "number"
      || !Number.isFinite(rawPayload.createdAtMs)
      || typeof rawPayload.id !== "string"
      || rawPayload.id.length === 0
    ) {
      throw buildInvalidCursorError();
    }

    return {
      createdAtMs: rawPayload.createdAtMs,
      id: rawPayload.id,
    };
  } catch (error) {
    if (error instanceof AppError)
      throw error;

    throw buildInvalidCursorError();
  }
}

/**
 * 保存优化任务与优化结果；若保存失败则返回可重试草稿。
 */
export async function persistPromptHistory(
  input: PersistPromptHistoryInput,
): Promise<PersistPromptHistoryResult> {
  const promptRunId = crypto.randomUUID();
  const savedPromptId = crypto.randomUUID();
  const createdAt = new Date();

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(promptRuns)
        .values({
          id: promptRunId,
          originalPrompt: input.originalPrompt,
          evaluationResult: input.evaluationResult,
          optimizedPrompt: input.optimizedPrompt,
          evaluateModelId: input.evaluateModelId,
          optimizeModelId: input.optimizeModelId,
          evaluateParams: input.evaluateParams,
          optimizeParams: input.optimizeParams,
          createdAt,
        });

      await tx
        .insert(savedPrompts)
        .values({
          id: savedPromptId,
          promptRunId,
          optimizedPrompt: input.optimizedPrompt,
          createdAt,
        });
    });

    return {
      promptRunId,
      savedPromptId,
      saved: true,
      retryable: false,
    };
  } catch {
    const saveDraft = createSignedSaveDraft({
      payload: {
        promptRunId,
        savedPromptId,
        originalPrompt: input.originalPrompt,
        evaluationResult: input.evaluationResult,
        optimizedPrompt: input.optimizedPrompt,
        evaluateModelId: input.evaluateModelId,
        optimizeModelId: input.optimizeModelId,
        evaluateParams: input.evaluateParams,
        optimizeParams: input.optimizeParams,
        createdAt: createdAt.toISOString(),
      },
    });

    return {
      promptRunId,
      savedPromptId,
      saved: false,
      retryable: true,
      saveDraft,
    };
  }
}

/**
 * 查询已保存优化提示词列表（仅返回优化文本及追溯标识）。
 */
export async function listSavedPrompts(options: {
  limit?: number;
  cursor?: string;
}): Promise<ListSavedPromptsResult> {
  const limit = options.limit ?? SAVED_PROMPTS_DEFAULT_LIMIT;
  const boundedLimit = Math.min(Math.max(limit, 1), SAVED_PROMPTS_MAX_LIMIT);
  const cursorPayload = options.cursor == null ? null : decodeCursor(options.cursor);
  const cursorDate = cursorPayload == null ? null : new Date(cursorPayload.createdAtMs);

  const rows = cursorPayload == null
    ? await db
        .select({
          id: savedPrompts.id,
          promptRunId: savedPrompts.promptRunId,
          optimizedPrompt: savedPrompts.optimizedPrompt,
          createdAt: savedPrompts.createdAt,
        })
        .from(savedPrompts)
        .orderBy(desc(savedPrompts.createdAt), desc(savedPrompts.id))
        .limit(boundedLimit + 1)
    : await db
        .select({
          id: savedPrompts.id,
          promptRunId: savedPrompts.promptRunId,
          optimizedPrompt: savedPrompts.optimizedPrompt,
          createdAt: savedPrompts.createdAt,
        })
        .from(savedPrompts)
        .where(
          or(
            lt(savedPrompts.createdAt, cursorDate!),
            and(eq(savedPrompts.createdAt, cursorDate!), lt(savedPrompts.id, cursorPayload.id)),
          ),
        )
        .orderBy(desc(savedPrompts.createdAt), desc(savedPrompts.id))
        .limit(boundedLimit + 1);

  const hasNext = rows.length > boundedLimit;
  const pageRows = hasNext ? rows.slice(0, boundedLimit) : rows;
  const pageItems = pageRows.map(item => ({
    id: item.id,
    promptRunId: item.promptRunId,
    optimizedPrompt: item.optimizedPrompt,
    createdAt: item.createdAt.toISOString(),
  }));

  let nextCursor: string | null = null;
  if (hasNext) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextCursor = encodeCursor({
      createdAtMs: lastItem.createdAt.getTime(),
      id: lastItem.id,
    });
  }

  return {
    items: pageItems,
    nextCursor,
  };
}

/**
 * 使用签名草稿重试保存优化任务和优化结果。
 */
export async function retryPersistSavedPrompt(input: SignedSaveDraft) {
  const verifiedDraft = verifySignedSaveDraft(input);
  const createdAt = new Date(verifiedDraft.payload.createdAt);

  await db.transaction(async (tx) => {
    await tx
      .insert(promptRuns)
      .values({
        id: verifiedDraft.payload.promptRunId,
        originalPrompt: verifiedDraft.payload.originalPrompt,
        evaluationResult: verifiedDraft.payload.evaluationResult,
        optimizedPrompt: verifiedDraft.payload.optimizedPrompt,
        evaluateModelId: verifiedDraft.payload.evaluateModelId,
        optimizeModelId: verifiedDraft.payload.optimizeModelId,
        evaluateParams: verifiedDraft.payload.evaluateParams,
        optimizeParams: verifiedDraft.payload.optimizeParams,
        createdAt,
      })
      .onConflictDoNothing();

    await tx
      .insert(savedPrompts)
      .values({
        id: verifiedDraft.payload.savedPromptId,
        promptRunId: verifiedDraft.payload.promptRunId,
        optimizedPrompt: verifiedDraft.payload.optimizedPrompt,
        createdAt,
      })
      .onConflictDoNothing();
  });

  const rows = await db
    .select({
      id: savedPrompts.id,
      promptRunId: savedPrompts.promptRunId,
    })
    .from(savedPrompts)
    .where(eq(savedPrompts.promptRunId, verifiedDraft.payload.promptRunId))
    .limit(1);

  const savedPrompt = rows[0];
  if (savedPrompt == null) {
    throw new AppError(
      AppErrorCode.SYSTEM_ERROR,
      INTERNAL_SERVER_ERROR,
      "重试保存失败，请稍后重试",
    );
  }

  return {
    promptRunId: savedPrompt.promptRunId,
    savedPromptId: savedPrompt.id,
    saved: true as const,
  };
}

export const savedPromptsPagingConstants = {
  SAVED_PROMPTS_DEFAULT_LIMIT,
  SAVED_PROMPTS_MAX_LIMIT,
} as const;
