import type {
  OptimizePageActions,
  OptimizePageDeps,
  OptimizePageState,
} from "../types";
import type { OptimizeFieldErrors } from "@/store";
import { useCallback } from "react";
import { useOptimizeCopyActions } from "./use-optimize-copy-actions";
import { useOptimizePageResource } from "./use-optimize-page-resource";
import { useOptimizeSubmitActions } from "./use-optimize-submit-actions";

export function useOptimizePageState(deps: OptimizePageDeps): {
  state: OptimizePageState;
  actions: OptimizePageActions;
} {
  const { onRequestError } = deps;
  const resource = useOptimizePageResource();

  const { evaluate, optimize, retrySave } = useOptimizeSubmitActions({
    resource,
    onRequestError,
  });

  const { copyEvaluation, copyOptimized } = useOptimizeCopyActions({
    resource,
    onRequestError,
  });

  const clearFieldError = useCallback((field: keyof OptimizeFieldErrors) => {
    resource.setFieldErrors(previous => ({
      ...previous,
      [field]: false,
    }));
  }, [resource]);

  return {
    state: {
      prompt: resource.prompt,
      evaluateModelId: resource.evaluateModelId,
      optimizeModelId: resource.optimizeModelId,
      evaluateTemperature: resource.evaluateTemperature,
      optimizeTemperature: resource.optimizeTemperature,
      evaluationResult: resource.evaluationResult,
      optimizedPrompt: resource.optimizedPrompt,
      evaluateResolvedModel: resource.evaluateResolvedModel,
      optimizeResolvedModel: resource.optimizeResolvedModel,
      saveDraft: resource.saveDraft,
      fieldErrors: resource.fieldErrors,
      modelOptions: resource.modelOptions,
      settingsLoading: resource.settingsLoading,
      evaluatePending: resource.evaluatePending,
      optimizePending: resource.optimizePending,
      retryPending: resource.retryPending,
      isEvaluateDisabled: resource.isEvaluateDisabled,
      isOptimizeDisabled: resource.isOptimizeDisabled,
    },
    actions: {
      setPrompt: (value) => {
        resource.setPrompt(value);
        clearFieldError("prompt");
      },
      setEvaluateModelId: resource.setEvaluateModelId,
      setOptimizeModelId: resource.setOptimizeModelId,
      setEvaluateTemperature: (value) => {
        resource.setEvaluateTemperature(value);
        clearFieldError("evaluateTemperature");
      },
      setOptimizeTemperature: (value) => {
        resource.setOptimizeTemperature(value);
        clearFieldError("optimizeTemperature");
      },
      evaluate,
      optimize,
      retrySave,
      copyEvaluation,
      copyOptimized,
    },
  };
}
