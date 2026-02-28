import type {
  createModelRoute,
  createOpenAICompatibleProviderRoute,
  getModelDefaultsRoute,
  listProvidersRoute,
  syncProviderModelsRoute,
  updateModelDefaultsRoute,
  updateModelRoute,
  updateProviderRoute,
} from "./model-settings.routes";
import type { AiModel } from "@/db/schemas/ai-model-schema";
import type { AiProvider } from "@/db/schemas/ai-provider-schema";

import type { AppRouteHandler } from "@/lib/types";
import { and, eq, inArray } from "drizzle-orm";

import { BAD_GATEWAY, NOT_FOUND, UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
import db from "@/db";
import { aiModelDefaults } from "@/db/schemas/ai-model-default-schema";
import { aiModels } from "@/db/schemas/ai-model-schema";
import { aiProviders } from "@/db/schemas/ai-provider-schema";
import { assertModelAvailable } from "@/lib/ai/model-resolver";
import { decryptProviderApiKey, encryptProviderApiKey, maskProviderApiKey } from "@/lib/ai/provider-key-crypto";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";

import { ok } from "@/lib/utils/http";

const DEFAULTS_SINGLETON_ID = 1;

interface ProviderModelPayload {
  id: string;
  providerId: string;
  modelName: string;
  displayName: string | null;
  enabled: boolean;
  source: "sync" | "manual";
  lastSyncedAt: string | null;
}

interface ProviderPayload {
  id: string;
  kind: "openai" | "openai-compatible";
  code: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string | null;
}

function toIsoString(value: Date | null) {
  return value == null ? null : value.toISOString();
}

function toModelPayload(model: AiModel): ProviderModelPayload {
  return {
    id: model.id,
    providerId: model.providerId,
    modelName: model.modelName,
    displayName: model.displayName ?? null,
    enabled: model.enabled,
    source: model.source,
    lastSyncedAt: toIsoString(model.lastSyncedAt ?? null),
  };
}

function toProviderPayload(provider: AiProvider): ProviderPayload {
  const hasApiKey = provider.apiKeyCiphertext != null && provider.apiKeyCiphertext.length > 0;
  const apiKeyMasked = hasApiKey
    ? maskProviderApiKey(decryptProviderApiKey(provider.apiKeyCiphertext!))
    : null;

  return {
    id: provider.id,
    kind: provider.kind,
    code: provider.code,
    name: provider.name,
    baseUrl: provider.baseUrl,
    enabled: provider.enabled,
    hasApiKey,
    apiKeyMasked,
  };
}

function normalizeOptionalApiKey(apiKey?: string) {
  if (apiKey == null)
    return undefined;

  const normalized = apiKey.trim();
  if (normalized.length === 0)
    return "";

  return normalized;
}

function slugifyProviderCode(name: string) {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.length > 0 ? normalized : "provider";
}

async function generateUniqueProviderCode(name: string) {
  const baseCode = slugifyProviderCode(name);
  let candidate = baseCode;
  let index = 2;

  while (true) {
    const rows = await db
      .select({ id: aiProviders.id })
      .from(aiProviders)
      .where(eq(aiProviders.code, candidate))
      .limit(1);

    if (rows.length === 0)
      return candidate;

    candidate = `${baseCode}-${index}`;
    index += 1;
  }
}

function isUniqueConstraintError(error: unknown) {
  if (!(error instanceof Error))
    return false;

  return /UNIQUE constraint failed/i.test(error.message);
}

async function getProviderById(providerId: string) {
  const rows = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.id, providerId))
    .limit(1);

  return rows[0] ?? null;
}

async function getModelById(modelId: string) {
  const rows = await db
    .select()
    .from(aiModels)
    .where(eq(aiModels.id, modelId))
    .limit(1);

  return rows[0] ?? null;
}

async function getDefaultsRow() {
  const rows = await db
    .select()
    .from(aiModelDefaults)
    .where(eq(aiModelDefaults.id, DEFAULTS_SINGLETON_ID))
    .limit(1);

  return rows[0] ?? null;
}

async function assertProviderDisableIsSafe(providerId: string) {
  const defaults = await getDefaultsRow();
  if (defaults == null)
    return;

  const referencedDefaultModelIds = [defaults.evaluateModelId, defaults.optimizeModelId].filter(
    (id): id is string => id != null,
  );

  if (referencedDefaultModelIds.length === 0)
    return;

  const rows = await db
    .select({ id: aiModels.id })
    .from(aiModels)
    .where(
      and(
        eq(aiModels.providerId, providerId),
        inArray(aiModels.id, referencedDefaultModelIds),
      ),
    )
    .limit(1);

  if (rows.length > 0) {
    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_INVALID,
      UNPROCESSABLE_ENTITY,
      "默认模型仍引用该服务商，请先调整默认模型",
    );
  }
}

async function assertModelDisableIsSafe(modelId: string) {
  const defaults = await getDefaultsRow();
  if (defaults == null)
    return;

  if (defaults.evaluateModelId === modelId || defaults.optimizeModelId === modelId) {
    throw new AppError(
      AppErrorCode.DEFAULT_MODEL_INVALID,
      UNPROCESSABLE_ENTITY,
      "默认模型仍引用该模型，请先调整默认模型",
    );
  }
}

function buildModelsSyncUrl(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("models", normalizedBaseUrl).toString();
}

interface RemoteModelItem {
  id: string;
  raw: unknown;
}

function extractRemoteModels(payload: unknown) {
  if (payload == null || typeof payload !== "object")
    return [] satisfies RemoteModelItem[];

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data))
    return [] satisfies RemoteModelItem[];

  const modelMap = new Map<string, RemoteModelItem>();
  for (const item of data) {
    if (item == null || typeof item !== "object")
      continue;

    const modelId = (item as { id?: unknown }).id;
    if (typeof modelId !== "string" || modelId.trim().length === 0)
      continue;

    modelMap.set(modelId, {
      id: modelId,
      raw: item,
    });
  }

  return [...modelMap.values()];
}

export const listProvidersHandler: AppRouteHandler<typeof listProvidersRoute> = async (c) => {
  const [providers, models] = await Promise.all([
    db.select().from(aiProviders),
    db.select().from(aiModels),
  ]);

  const modelsByProviderId = new Map<string, ProviderModelPayload[]>();
  for (const model of models) {
    const existing = modelsByProviderId.get(model.providerId) ?? [];
    existing.push(toModelPayload(model));
    modelsByProviderId.set(model.providerId, existing);
  }

  return ok(c, {
    providers: providers.map((provider: AiProvider) => ({
      ...toProviderPayload(provider),
      models: modelsByProviderId.get(provider.id) ?? [],
    })),
  });
};

export const createOpenAICompatibleProviderHandler: AppRouteHandler<typeof createOpenAICompatibleProviderRoute> = async (c) => {
  const body = c.req.valid("json");
  const code = await generateUniqueProviderCode(body.name);
  const normalizedApiKey = normalizeOptionalApiKey(body.apiKey);

  const rows = await db.transaction(async (tx) => {
    return await tx
      .insert(aiProviders)
      .values({
        id: crypto.randomUUID(),
        kind: "openai-compatible",
        code,
        name: body.name.trim(),
        baseUrl: body.baseUrl,
        enabled: false,
        apiKeyCiphertext: normalizedApiKey == null || normalizedApiKey === ""
          ? null
          : encryptProviderApiKey(normalizedApiKey),
      })
      .returning({ id: aiProviders.id });
  });

  return ok(c, {
    providerId: rows[0]!.id,
  });
};

export const updateProviderHandler: AppRouteHandler<typeof updateProviderRoute> = async (c) => {
  const { providerId } = c.req.valid("param");
  const body = c.req.valid("json");
  const provider = await getProviderById(providerId);
  if (provider == null) {
    throw new AppError(
      AppErrorCode.PROVIDER_NOT_FOUND,
      NOT_FOUND,
    );
  }

  if (body.enabled === false) {
    await assertProviderDisableIsSafe(providerId);
  }

  const normalizedApiKey = normalizeOptionalApiKey(body.apiKey);
  const updatePayload: Partial<typeof aiProviders.$inferInsert> = {};

  if (body.name != null)
    updatePayload.name = body.name.trim();

  if (body.baseUrl != null)
    updatePayload.baseUrl = body.baseUrl;

  if (body.enabled != null)
    updatePayload.enabled = body.enabled;

  if (normalizedApiKey !== undefined) {
    updatePayload.apiKeyCiphertext = normalizedApiKey === ""
      ? null
      : encryptProviderApiKey(normalizedApiKey);
  }

  if (Object.keys(updatePayload).length > 0) {
    await db.transaction(async (tx) => {
      await tx
        .update(aiProviders)
        .set(updatePayload)
        .where(eq(aiProviders.id, providerId));
    });
  }

  const refreshedProvider = await getProviderById(providerId);

  return ok(c, {
    provider: toProviderPayload(refreshedProvider!),
  });
};

export const syncProviderModelsHandler: AppRouteHandler<typeof syncProviderModelsRoute> = async (c) => {
  const { providerId } = c.req.valid("param");
  const provider = await getProviderById(providerId);
  if (provider == null) {
    throw new AppError(
      AppErrorCode.PROVIDER_NOT_FOUND,
      NOT_FOUND,
    );
  }

  if (provider.apiKeyCiphertext == null || provider.apiKeyCiphertext.length === 0) {
    throw new AppError(
      AppErrorCode.PROVIDER_API_KEY_MISSING,
      UNPROCESSABLE_ENTITY,
    );
  }

  let plainApiKey: string;
  try {
    plainApiKey = decryptProviderApiKey(provider.apiKeyCiphertext);
  } catch {
    throw new AppError(
      AppErrorCode.PROVIDER_API_KEY_MISSING,
      UNPROCESSABLE_ENTITY,
      "服务商 API Key 不可解密，请重新配置",
    );
  }

  const syncUrl = buildModelsSyncUrl(provider.baseUrl);
  const response = await fetch(syncUrl, {
    method: "GET",
    headers: {
      "authorization": `Bearer ${plainApiKey}`,
      "content-type": "application/json",
    },
  }).catch((error) => {
    throw new AppError(
      AppErrorCode.MODEL_SYNC_FAILED,
      BAD_GATEWAY,
      "模型同步失败，请检查服务商网络配置",
      error instanceof Error ? { message: error.message } : undefined,
    );
  });

  if (!response.ok) {
    throw new AppError(
      AppErrorCode.MODEL_SYNC_FAILED,
      BAD_GATEWAY,
      `模型同步失败，上游返回状态码 ${response.status}`,
    );
  }

  const payload = await response.json().catch(() => null);
  const remoteModels = extractRemoteModels(payload);
  const existingModels = await db
    .select({ modelName: aiModels.modelName })
    .from(aiModels)
    .where(eq(aiModels.providerId, providerId));
  const existingModelNameSet = new Set(existingModels.map((item: { modelName: string }) => item.modelName));

  let inserted = 0;
  let updated = 0;
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const item of remoteModels) {
      if (existingModelNameSet.has(item.id))
        updated += 1;
      else inserted += 1;

      await tx
        .insert(aiModels)
        .values({
          id: crypto.randomUUID(),
          providerId,
          modelName: item.id,
          displayName: null,
          enabled: true,
          source: "sync",
          raw: JSON.stringify(item.raw),
          lastSyncedAt: now,
        })
        .onConflictDoUpdate({
          target: [aiModels.providerId, aiModels.modelName],
          set: {
            enabled: true,
            source: "sync",
            raw: JSON.stringify(item.raw),
            lastSyncedAt: now,
            updatedAt: now,
          },
        });
    }
  });

  return ok(c, {
    providerId,
    inserted,
    updated,
    total: remoteModels.length,
  });
};

export const createModelHandler: AppRouteHandler<typeof createModelRoute> = async (c) => {
  const body = c.req.valid("json");
  const provider = await getProviderById(body.providerId);
  if (provider == null) {
    throw new AppError(
      AppErrorCode.PROVIDER_NOT_FOUND,
      NOT_FOUND,
    );
  }

  try {
    const rows = await db.transaction(async (tx) => {
      return await tx
        .insert(aiModels)
        .values({
          id: crypto.randomUUID(),
          providerId: body.providerId,
          modelName: body.modelName.trim(),
          displayName: body.displayName?.trim() ?? null,
          enabled: true,
          source: "manual",
          raw: null,
          lastSyncedAt: null,
        })
        .returning({ id: aiModels.id });
    });

    return ok(c, {
      modelId: rows[0]!.id,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        AppErrorCode.MODEL_CONFLICT,
        UNPROCESSABLE_ENTITY,
      );
    }

    throw error;
  }
};

export const updateModelHandler: AppRouteHandler<typeof updateModelRoute> = async (c) => {
  const { modelId } = c.req.valid("param");
  const body = c.req.valid("json");
  const model = await getModelById(modelId);
  if (model == null) {
    throw new AppError(
      AppErrorCode.MODEL_NOT_FOUND,
      NOT_FOUND,
    );
  }

  if (body.enabled === false)
    await assertModelDisableIsSafe(modelId);

  const updatePayload: Partial<typeof aiModels.$inferInsert> = {};
  if (body.displayName !== undefined) {
    updatePayload.displayName = body.displayName == null ? null : body.displayName.trim();
  }

  if (body.enabled !== undefined)
    updatePayload.enabled = body.enabled;

  if (Object.keys(updatePayload).length > 0) {
    await db.transaction(async (tx) => {
      await tx
        .update(aiModels)
        .set(updatePayload)
        .where(eq(aiModels.id, modelId));
    });
  }

  const refreshedModel = await getModelById(modelId);
  return ok(c, {
    model: toModelPayload(refreshedModel!),
  });
};

export const getModelDefaultsHandler: AppRouteHandler<typeof getModelDefaultsRoute> = async (c) => {
  const defaults = await getDefaultsRow();

  return ok(c, {
    evaluateModelId: defaults?.evaluateModelId ?? null,
    optimizeModelId: defaults?.optimizeModelId ?? null,
  });
};

export const updateModelDefaultsHandler: AppRouteHandler<typeof updateModelDefaultsRoute> = async (c) => {
  const body = c.req.valid("json");
  const defaults = await getDefaultsRow();

  const evaluateModelId = body.evaluateModelId === undefined
    ? (defaults?.evaluateModelId ?? null)
    : body.evaluateModelId;
  const optimizeModelId = body.optimizeModelId === undefined
    ? (defaults?.optimizeModelId ?? null)
    : body.optimizeModelId;

  if (evaluateModelId != null) {
    await assertModelAvailable(evaluateModelId);
  }

  if (optimizeModelId != null) {
    await assertModelAvailable(optimizeModelId);
  }

  await db.transaction(async (tx) => {
    if (defaults == null) {
      await tx.insert(aiModelDefaults).values({
        id: DEFAULTS_SINGLETON_ID,
        evaluateModelId,
        optimizeModelId,
      });
      return;
    }

    await tx
      .update(aiModelDefaults)
      .set({
        evaluateModelId,
        optimizeModelId,
      })
      .where(eq(aiModelDefaults.id, DEFAULTS_SINGLETON_ID));
  });

  return ok(c, {
    evaluateModelId,
    optimizeModelId,
  });
};
