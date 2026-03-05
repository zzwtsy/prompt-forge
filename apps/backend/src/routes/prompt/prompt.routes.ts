import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";

import { jsonApiContent, jsonApiError } from "@/lib/openapi/helpers";
import { requireAuth } from "@/middlewares/require-permission";

const tags = ["PromptRuntime"];

const ResolvedModelSchema = z.object({
  providerId: z.string(),
  providerKind: z.enum(["openai", "openai-compatible"]),
  modelId: z.string(),
  modelName: z.string(),
});

const PromptCallParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
});

const EvaluatePromptBodySchema = z.object({
  prompt: z.string().min(1),
  modelId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const EvaluatePromptResponseSchema = z.object({
  evaluationResult: z.string(),
  resolvedModel: ResolvedModelSchema,
});

const OptimizePromptBodySchema = z.object({
  prompt: z.string().min(1),
  evaluationResult: z.string().optional(),
  modelId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  evaluateContext: z.object({
    modelId: z.string().min(1),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
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

const OptimizePromptResponseSchema = z.object({
  optimizedPrompt: z.string(),
  resolvedModel: ResolvedModelSchema,
  promptRunId: z.string(),
  savedPromptId: z.string(),
  persistence: z.object({
    saved: z.boolean(),
    retryable: z.boolean(),
    saveDraft: SignedSaveDraftSchema.optional(),
  }),
});

export const evaluatePromptRoute = createRoute({
  path: "/api/prompt/evaluate",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(EvaluatePromptBodySchema, "评估提示词请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(EvaluatePromptResponseSchema, "评估提示词成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("模型不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("模型不可用或默认模型未设置"),
  },
});

export const optimizePromptRoute = createRoute({
  path: "/api/prompt/optimize",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(OptimizePromptBodySchema, "优化提示词请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(OptimizePromptResponseSchema, "优化提示词成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("模型不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("模型不可用或默认模型未设置"),
  },
});
