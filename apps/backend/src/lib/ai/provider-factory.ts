import type { LanguageModel } from "ai";

import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface RuntimeProviderConfig {
  kind: "openai" | "openai-compatible";
  code: string;
  baseUrl: string;
  apiKey: string;
}

const OPENAI_FALLBACK_BASE_URL = "https://api.openai.com/v1";

/**
 * 根据 provider 配置创建可直接传入 AI SDK 的语言模型实例。
 */
export function createProviderLanguageModel(config: RuntimeProviderConfig, modelName: string): LanguageModel {
  if (config.kind === "openai") {
    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || OPENAI_FALLBACK_BASE_URL,
    });

    return provider(modelName);
  }

  const provider = createOpenAICompatible({
    name: config.code,
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return provider(modelName);
}
