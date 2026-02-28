import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";

import { jsonApiContent, jsonApiError } from "@/lib/openapi/helpers";
import { requireAuth } from "@/middlewares/require-permission";

const tags = ["ModelSettings"];

const ProviderIdParamSchema = z.object({
  providerId: z.string().min(1),
});

const ModelIdParamSchema = z.object({
  modelId: z.string().min(1),
});

const ModelItemSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  modelName: z.string(),
  displayName: z.string().nullable(),
  enabled: z.boolean(),
  source: z.enum(["sync", "manual"]),
  lastSyncedAt: z.iso.datetime().nullable(),
});

const ProviderItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["openai", "openai-compatible"]),
  code: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  enabled: z.boolean(),
  hasApiKey: z.boolean(),
  apiKeyMasked: z.string().nullable(),
  models: z.array(ModelItemSchema),
});

const ListProvidersResponseSchema = z.object({
  providers: z.array(ProviderItemSchema),
});

const CreateOpenAICompatibleProviderBodySchema = z.object({
  name: z.string().min(1),
  baseUrl: z.url(),
  apiKey: z.string().optional(),
});

const CreateOpenAICompatibleProviderResponseSchema = z.object({
  providerId: z.string(),
});

const UpdateProviderBodySchema = z.object({
  name: z.string().min(1).optional(),
  baseUrl: z.url().optional(),
  enabled: z.boolean().optional(),
  apiKey: z.string().optional(),
});

const UpdateProviderResponseSchema = z.object({
  provider: ProviderItemSchema.omit({ models: true }),
});

const SyncProviderModelsResponseSchema = z.object({
  providerId: z.string(),
  inserted: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const CreateModelBodySchema = z.object({
  providerId: z.string().min(1),
  modelName: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

const CreateModelResponseSchema = z.object({
  modelId: z.string(),
});

const UpdateModelBodySchema = z.object({
  displayName: z.string().min(1).nullable().optional(),
  enabled: z.boolean().optional(),
});

const UpdateModelResponseSchema = z.object({
  model: ModelItemSchema,
});

const ModelDefaultsSchema = z.object({
  evaluateModelId: z.string().nullable(),
  optimizeModelId: z.string().nullable(),
});

const UpdateModelDefaultsBodySchema = z.object({
  evaluateModelId: z.string().nullable().optional(),
  optimizeModelId: z.string().nullable().optional(),
});

export const listProvidersRoute = createRoute({
  path: "/api/providers",
  method: "get",
  tags,
  middleware: [requireAuth()],
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ListProvidersResponseSchema, "查询服务商及模型列表成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
  },
});

export const createOpenAICompatibleProviderRoute = createRoute({
  path: "/api/providers/openai-compatible",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(CreateOpenAICompatibleProviderBodySchema, "创建 OpenAI Compatible 服务商请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(CreateOpenAICompatibleProviderResponseSchema, "创建服务商成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("请求参数校验失败"),
  },
});

export const updateProviderRoute = createRoute({
  path: "/api/providers/{providerId}",
  method: "put",
  tags,
  middleware: [requireAuth()],
  request: {
    params: ProviderIdParamSchema,
    body: jsonContentRequired(UpdateProviderBodySchema, "更新服务商配置请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(UpdateProviderResponseSchema, "更新服务商成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("服务商不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("服务商更新失败"),
  },
});

export const syncProviderModelsRoute = createRoute({
  path: "/api/providers/{providerId}/models/sync",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    params: ProviderIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(SyncProviderModelsResponseSchema, "同步模型成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("服务商不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("服务商配置不完整"),
    [HttpStatusCodes.BAD_GATEWAY]: jsonApiError("同步上游模型失败"),
  },
});

export const createModelRoute = createRoute({
  path: "/api/models",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(CreateModelBodySchema, "手动新增模型请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(CreateModelResponseSchema, "新增模型成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("服务商不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("模型冲突或请求非法"),
  },
});

export const updateModelRoute = createRoute({
  path: "/api/models/{modelId}",
  method: "put",
  tags,
  middleware: [requireAuth()],
  request: {
    params: ModelIdParamSchema,
    body: jsonContentRequired(UpdateModelBodySchema, "更新模型配置请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(UpdateModelResponseSchema, "更新模型成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("模型不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("模型更新失败"),
  },
});

export const getModelDefaultsRoute = createRoute({
  path: "/api/model-defaults",
  method: "get",
  tags,
  middleware: [requireAuth()],
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ModelDefaultsSchema, "查询默认模型成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
  },
});

export const updateModelDefaultsRoute = createRoute({
  path: "/api/model-defaults",
  method: "put",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(UpdateModelDefaultsBodySchema, "更新默认模型请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ModelDefaultsSchema, "更新默认模型成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.NOT_FOUND]: jsonApiError("模型不存在"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("默认模型不可用"),
  },
});
