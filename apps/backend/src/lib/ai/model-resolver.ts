import type { LanguageModel } from "ai";

import { and, eq } from "drizzle-orm";
import { NOT_FOUND, UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";

import db from "@/db";
import { aiModelDefaults } from "@/db/schemas/ai-model-default-schema";
import { aiModels } from "@/db/schemas/ai-model-schema";
import { aiProviders } from "@/db/schemas/ai-provider-schema";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";

import { createProviderLanguageModel } from "./provider-factory";
import { decryptProviderApiKey } from "./provider-key-crypto";

export interface ResolvedModelMetadata {
  providerId: string;
  providerKind: "openai" | "openai-compatible";
  modelId: string;
  modelName: string;
}

export interface ResolvedRuntimeModel {
  model: LanguageModel;
  resolvedModel: ResolvedModelMetadata;
}

type ResolvedModelPurpose = "evaluate" | "optimize";

interface RuntimeModelRecord {
  modelId: string;
  modelName: string;
  modelEnabled: boolean;
  providerId: string;
  providerKind: "openai" | "openai-compatible";
  providerCode: string;
  providerBaseUrl: string;
  providerEnabled: boolean;
  providerApiKeyCiphertext: string | null;
}

const DEFAULTS_SINGLETON_ID = 1;

function buildResolvedMetadata(record: RuntimeModelRecord): ResolvedModelMetadata {
  return {
    providerId: record.providerId,
    providerKind: record.providerKind,
    modelId: record.modelId,
    modelName: record.modelName,
  };
}

/**
 * 读取指定模型及其 provider 配置。
 */
async function findRuntimeModelRecord(modelId: string) {
  const rows = await db
    .select({
      modelId: aiModels.id,
      modelName: aiModels.modelName,
      modelEnabled: aiModels.enabled,
      providerId: aiProviders.id,
      providerKind: aiProviders.kind,
      providerCode: aiProviders.code,
      providerBaseUrl: aiProviders.baseUrl,
      providerEnabled: aiProviders.enabled,
      providerApiKeyCiphertext: aiProviders.apiKeyCiphertext,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
    .where(eq(aiModels.id, modelId))
    .limit(1);

  return rows[0] satisfies RuntimeModelRecord | undefined;
}

function ensureRuntimeModelAvailable(record: RuntimeModelRecord) {
  if (!record.modelEnabled) {
    throw new AppError(
      AppErrorCode.MODEL_DISABLED,
      UNPROCESSABLE_ENTITY,
    );
  }

  if (!record.providerEnabled) {
    throw new AppError(
      AppErrorCode.PROVIDER_DISABLED,
      UNPROCESSABLE_ENTITY,
    );
  }

  if (record.providerApiKeyCiphertext == null || record.providerApiKeyCiphertext.length === 0) {
    throw new AppError(
      AppErrorCode.PROVIDER_API_KEY_MISSING,
      UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * 校验指定模型是否可作为默认模型或运行时模型使用。
 */
export async function assertModelAvailable(modelId: string) {
  const record = await findRuntimeModelRecord(modelId);
  if (record == null) {
    throw new AppError(
      AppErrorCode.MODEL_NOT_FOUND,
      NOT_FOUND,
    );
  }

  ensureRuntimeModelAvailable(record);
}

async function resolveDefaultModelId(purpose: ResolvedModelPurpose) {
  const rows = await db
    .select({
      evaluateModelId: aiModelDefaults.evaluateModelId,
      optimizeModelId: aiModelDefaults.optimizeModelId,
    })
    .from(aiModelDefaults)
    .where(eq(aiModelDefaults.id, DEFAULTS_SINGLETON_ID))
    .limit(1);

  const defaults = rows[0];
  if (defaults == null) {
    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_NOT_SET,
      UNPROCESSABLE_ENTITY,
    );
  }

  const modelId = purpose === "evaluate" ? defaults.evaluateModelId : defaults.optimizeModelId;
  if (modelId == null) {
    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_NOT_SET,
      UNPROCESSABLE_ENTITY,
    );
  }

  return modelId;
}

/**
 * 解析评估/优化请求对应的最终运行模型。
 */
export async function resolveRuntimeModel(options: {
  purpose: ResolvedModelPurpose;
  modelId?: string | null;
}): Promise<ResolvedRuntimeModel> {
  const explicitModelId = options.modelId?.trim();
  const selectedModelId = explicitModelId != null && explicitModelId.length > 0
    ? explicitModelId
    : await resolveDefaultModelId(options.purpose);

  const record = await findRuntimeModelRecord(selectedModelId);
  if (record == null) {
    if (explicitModelId != null && explicitModelId.length > 0) {
      throw new AppError(
        AppErrorCode.MODEL_NOT_FOUND,
        NOT_FOUND,
      );
    }

    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_INVALID,
      UNPROCESSABLE_ENTITY,
    );
  }

  ensureRuntimeModelAvailable(record);

  let apiKey: string;
  try {
    apiKey = decryptProviderApiKey(record.providerApiKeyCiphertext!);
  } catch {
    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_INVALID,
      UNPROCESSABLE_ENTITY,
      "默认模型绑定的服务商密钥无效，请重新配置",
    );
  }

  const languageModel = createProviderLanguageModel({
    kind: record.providerKind,
    code: record.providerCode,
    baseUrl: record.providerBaseUrl,
    apiKey,
  }, record.modelName);

  return {
    model: languageModel,
    resolvedModel: buildResolvedMetadata(record),
  };
}

/**
 * 校验模型与 provider 是否存在绑定关系，用于默认模型防护校验。
 */
export async function hasModelUnderProvider(providerId: string, modelId: string) {
  const rows = await db
    .select({ id: aiModels.id })
    .from(aiModels)
    .where(and(eq(aiModels.id, modelId), eq(aiModels.providerId, providerId)))
    .limit(1);

  return rows.length > 0;
}
