import type { EvaluateResponseData, OptimizeResponseData } from "../types";
import Apis from "@/api";
import { unwrapApiEnvelope } from "@/lib/api-envelope";

export async function evaluatePrompt(payload: {
  prompt: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const response = await Apis.PromptRuntime.post_api_prompt_evaluate({
    data: payload,
  }).send();

  return unwrapApiEnvelope<EvaluateResponseData>(response);
}

export async function optimizePrompt(payload: {
  prompt: string;
  evaluationResult?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  evaluateContext?: {
    modelId: string;
    temperature?: number;
    maxTokens?: number;
  };
}) {
  const response = await Apis.PromptRuntime.post_api_prompt_optimize({
    data: payload,
  }).send();

  return unwrapApiEnvelope<OptimizeResponseData>(response);
}
