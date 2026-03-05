import type { CallSettings } from "ai";
import type { evaluatePromptRoute, optimizePromptRoute } from "./prompt.routes";
import type { PromptCallParams } from "@/lib/ai/save-draft-signing";

import type { AppRouteHandler } from "@/lib/types";

import { generateText } from "ai";
import { resolveRuntimeModel } from "@/lib/ai/model-resolver";
import { persistPromptHistory } from "@/lib/prompt/prompt-history-service";

import { ok } from "@/lib/utils/http";

/**
 * 统一拼装 AI SDK 调用参数，避免 route handler 内重复映射。
 */
function buildCallSettings(options: {
  temperature?: number;
}) {
  const settings: CallSettings = {};

  if (options.temperature != null)
    settings.temperature = options.temperature;

  return settings;
}

function buildPromptCallParams(options: {
  temperature?: number;
}): PromptCallParams | null {
  const params: PromptCallParams = {};
  if (options.temperature != null)
    params.temperature = options.temperature;

  if (Object.keys(params).length === 0)
    return null;

  return params;
}

function buildEvaluatePrompt(inputPrompt: string) {
  return [
    "你是资深提示词评估助手，请输出结构化、可执行的中文评估结论。",
    "请从以下维度评估用户提示词：清晰度、目标完整性、约束明确性、可执行性、潜在歧义。",
    "输出格式要求：",
    "1. 总结（2-3 句）",
    "2. 主要问题（最多 5 条）",
    "3. 改进建议（最多 5 条）",
    "",
    "待评估提示词：",
    inputPrompt,
  ].join("\n");
}

function buildOptimizePrompt(input: {
  prompt: string;
  evaluationResult?: string;
}) {
  return [
    "你是资深提示词优化助手，请输出可直接使用的优化后提示词（中文）。",
    "要求：",
    "1. 保留原始意图，不新增无关目标。",
    "2. 明确输入、步骤、输出格式和约束。",
    "3. 语言简洁，避免含糊表达。",
    "",
    "原始提示词：",
    input.prompt,
    "",
    "评估结果（可选参考）：",
    input.evaluationResult ?? "无",
    "",
    "请仅返回优化后的完整提示词正文。",
  ].join("\n");
}

export const evaluatePromptHandler: AppRouteHandler<typeof evaluatePromptRoute> = async (c) => {
  const body = c.req.valid("json");
  const runtimeModel = await resolveRuntimeModel({
    purpose: "evaluate",
    modelId: body.modelId,
  });
  const result = await generateText({
    model: runtimeModel.model,
    prompt: buildEvaluatePrompt(body.prompt),
    ...buildCallSettings({
      temperature: body.temperature,
    }),
  });

  return ok(c, {
    evaluationResult: result.text,
    resolvedModel: runtimeModel.resolvedModel,
  });
};

export const optimizePromptHandler: AppRouteHandler<typeof optimizePromptRoute> = async (c) => {
  const body = c.req.valid("json");
  const runtimeModel = await resolveRuntimeModel({
    purpose: "optimize",
    modelId: body.modelId,
  });
  const result = await generateText({
    model: runtimeModel.model,
    prompt: buildOptimizePrompt({
      prompt: body.prompt,
      evaluationResult: body.evaluationResult,
    }),
    ...buildCallSettings({
      temperature: body.temperature,
    }),
  });

  const persistResult = await persistPromptHistory({
    originalPrompt: body.prompt,
    evaluationResult: body.evaluationResult ?? null,
    optimizedPrompt: result.text,
    evaluateModelId: body.evaluateContext?.modelId ?? null,
    optimizeModelId: runtimeModel.resolvedModel.modelId,
    evaluateParams: buildPromptCallParams({
      temperature: body.evaluateContext?.temperature,
    }),
    optimizeParams: buildPromptCallParams({
      temperature: body.temperature,
    }),
  });

  return ok(c, {
    optimizedPrompt: result.text,
    resolvedModel: runtimeModel.resolvedModel,
    promptRunId: persistResult.promptRunId,
    savedPromptId: persistResult.savedPromptId,
    persistence: {
      saved: persistResult.saved,
      retryable: persistResult.retryable,
      saveDraft: persistResult.saveDraft,
    },
  });
};
