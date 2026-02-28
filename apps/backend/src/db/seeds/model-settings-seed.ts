import { eq } from "drizzle-orm";

import db from "@/db";
import { aiModelDefaults } from "@/db/schemas/ai-model-default-schema";
import { aiProviders } from "@/db/schemas/ai-provider-schema";

const OPENAI_PROVIDER_CODE = "openai";
const OPENAI_PROVIDER_NAME = "OpenAI";
const OPENAI_PROVIDER_BASE_URL = "https://api.openai.com/v1";
const DEFAULTS_SINGLETON_ID = 1;

/**
 * 启动阶段确保模型设置基础数据存在。
 *
 * 约束：
 * 1. 仅做“缺失补齐”，不覆盖用户已有配置。
 * 2. 所有写入在同一事务内，保证幂等与一致性。
 */
export async function ensureModelSettingsSeed() {
  await db.transaction(async (tx) => {
    const existingOpenAIProvider = await tx
      .select({ id: aiProviders.id })
      .from(aiProviders)
      .where(eq(aiProviders.code, OPENAI_PROVIDER_CODE))
      .limit(1);

    if (existingOpenAIProvider.length === 0) {
      await tx.insert(aiProviders).values({
        id: crypto.randomUUID(),
        kind: "openai",
        code: OPENAI_PROVIDER_CODE,
        name: OPENAI_PROVIDER_NAME,
        baseUrl: OPENAI_PROVIDER_BASE_URL,
        apiKeyCiphertext: null,
        enabled: false,
      });
    }

    const existingDefaults = await tx
      .select({ id: aiModelDefaults.id })
      .from(aiModelDefaults)
      .where(eq(aiModelDefaults.id, DEFAULTS_SINGLETON_ID))
      .limit(1);

    if (existingDefaults.length === 0) {
      await tx.insert(aiModelDefaults).values({
        id: DEFAULTS_SINGLETON_ID,
        evaluateModelId: null,
        optimizeModelId: null,
      });
    }
  });
}

export const modelSettingsSeedConstants = {
  OPENAI_PROVIDER_CODE,
  OPENAI_PROVIDER_NAME,
  OPENAI_PROVIDER_BASE_URL,
  DEFAULTS_SINGLETON_ID,
} as const;
