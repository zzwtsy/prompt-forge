import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";

import { jsonApiContent, jsonApiError } from "@/lib/openapi/helpers";
import { requireAuth } from "@/middlewares/require-permission";

const tags = ["SavedPrompts"];

const PromptCallParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
});

const SavedPromptItemSchema = z.object({
  id: z.string(),
  promptRunId: z.string(),
  optimizedPrompt: z.string(),
  createdAt: z.iso.datetime(),
});

const ListSavedPromptsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(),
});

const ListSavedPromptsResponseSchema = z.object({
  items: z.array(SavedPromptItemSchema),
  nextCursor: z.string().nullable(),
});

const SignedSaveDraftSchema = z.object({
  version: z.literal("v1"),
  issuedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  payload: z.object({
    promptRunId: z.string(),
    savedPromptId: z.string(),
    originalPrompt: z.string(),
    evaluationResult: z.string().nullable(),
    optimizedPrompt: z.string(),
    evaluateModelId: z.string().nullable(),
    optimizeModelId: z.string(),
    evaluateParams: PromptCallParamsSchema.nullable(),
    optimizeParams: PromptCallParamsSchema.nullable(),
    createdAt: z.iso.datetime(),
  }),
  signature: z.string(),
});

const RetrySavedPromptBodySchema = z.object({
  saveDraft: SignedSaveDraftSchema,
});

const RetrySavedPromptResponseSchema = z.object({
  promptRunId: z.string(),
  savedPromptId: z.string(),
  saved: z.literal(true),
});

export const listSavedPromptsRoute = createRoute({
  path: "/api/saved-prompts",
  method: "get",
  tags,
  middleware: [requireAuth()],
  request: {
    query: ListSavedPromptsQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ListSavedPromptsResponseSchema, "查询已保存优化提示词成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("分页参数无效"),
  },
});

export const retrySavedPromptRoute = createRoute({
  path: "/api/saved-prompts/retry",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(RetrySavedPromptBodySchema, "重试保存请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(RetrySavedPromptResponseSchema, "重试保存成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("保存草稿无效或已过期"),
  },
});
