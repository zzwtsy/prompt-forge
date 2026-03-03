import Apis from "@/api";

interface EvaluateContext {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
}

interface PromptPayload {
  prompt: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OptimizePayload extends PromptPayload {
  evaluationResult?: string;
  evaluateContext?: EvaluateContext;
}

export const promptRuntimeMethods = {
  evaluate(payload: PromptPayload) {
    return Apis.PromptRuntime.post_api_prompt_evaluate({
      data: {
        ...payload,
        prompt: payload.prompt.trim(),
      },
    });
  },
  optimize(payload: OptimizePayload) {
    const evaluationResult = payload.evaluationResult?.trim();

    return Apis.PromptRuntime.post_api_prompt_optimize({
      data: {
        ...payload,
        prompt: payload.prompt.trim(),
        evaluationResult: evaluationResult !== undefined && evaluationResult.length > 0 ? evaluationResult : undefined,
      },
    });
  },
};
