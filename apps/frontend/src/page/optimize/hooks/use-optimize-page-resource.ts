import { useRequest } from "alova/client";
import { useMemo, useRef } from "react";
import {
  promptRuntimeMethods,
  savedPromptsMethods,
} from "@/lib/workbench-api";
import {
  getEnabledModelOptions,
  useWorkbenchToast,
} from "@/lib/workbench-shell";
import {
  useOptimizeSessionStore,
  useWorkbenchShellStore,
} from "@/store";

export function useOptimizePageResource() {
  const notice = useWorkbenchToast();

  const providers = useWorkbenchShellStore(state => state.providers);
  const providersLoading = useWorkbenchShellStore(state => state.providersLoading);
  const defaultsLoading = useWorkbenchShellStore(state => state.defaultsLoading);
  const bumpHistoryRefreshToken = useWorkbenchShellStore(state => state.bumpHistoryRefreshToken);

  const prompt = useOptimizeSessionStore(state => state.prompt);
  const setPrompt = useOptimizeSessionStore(state => state.setPrompt);
  const evaluateModelId = useOptimizeSessionStore(state => state.evaluateModelId);
  const setEvaluateModelId = useOptimizeSessionStore(state => state.setEvaluateModelId);
  const optimizeModelId = useOptimizeSessionStore(state => state.optimizeModelId);
  const setOptimizeModelId = useOptimizeSessionStore(state => state.setOptimizeModelId);
  const evaluateTemperature = useOptimizeSessionStore(state => state.evaluateTemperature);
  const setEvaluateTemperature = useOptimizeSessionStore(state => state.setEvaluateTemperature);
  const optimizeTemperature = useOptimizeSessionStore(state => state.optimizeTemperature);
  const setOptimizeTemperature = useOptimizeSessionStore(state => state.setOptimizeTemperature);
  const evaluationResult = useOptimizeSessionStore(state => state.evaluationResult);
  const setEvaluationResult = useOptimizeSessionStore(state => state.setEvaluationResult);
  const optimizedPrompt = useOptimizeSessionStore(state => state.optimizedPrompt);
  const setOptimizedPrompt = useOptimizeSessionStore(state => state.setOptimizedPrompt);
  const evaluateResolvedModel = useOptimizeSessionStore(state => state.evaluateResolvedModel);
  const setEvaluateResolvedModel = useOptimizeSessionStore(state => state.setEvaluateResolvedModel);
  const optimizeResolvedModel = useOptimizeSessionStore(state => state.optimizeResolvedModel);
  const setOptimizeResolvedModel = useOptimizeSessionStore(state => state.setOptimizeResolvedModel);
  const evaluateContext = useOptimizeSessionStore(state => state.evaluateContext);
  const setEvaluateContext = useOptimizeSessionStore(state => state.setEvaluateContext);
  const saveDraft = useOptimizeSessionStore(state => state.saveDraft);
  const setSaveDraft = useOptimizeSessionStore(state => state.setSaveDraft);
  const fieldErrors = useOptimizeSessionStore(state => state.fieldErrors);
  const setFieldErrors = useOptimizeSessionStore(state => state.setFieldErrors);

  const {
    loading: evaluatePending,
    send: sendEvaluate,
  } = useRequest(promptRuntimeMethods.evaluate, {
    immediate: false,
  });

  const {
    loading: optimizePending,
    send: sendOptimize,
  } = useRequest(promptRuntimeMethods.optimize, {
    immediate: false,
  });

  const {
    loading: retryPending,
    send: sendRetrySave,
  } = useRequest(savedPromptsMethods.retrySavePrompt, {
    immediate: false,
  });

  const modelOptions = useMemo(() => {
    return getEnabledModelOptions(providers);
  }, [providers]);

  const settingsLoading = providersLoading || defaultsLoading;
  const isEvaluateDisabled = prompt.trim().length === 0 || evaluatePending || optimizePending;
  const isOptimizeDisabled = evaluationResult.trim().length === 0 || optimizePending || evaluatePending;

  const evaluateRequestSeqRef = useRef(0);
  const optimizeRequestSeqRef = useRef(0);
  const retrySaveRequestSeqRef = useRef(0);

  return {
    notice,
    bumpHistoryRefreshToken,
    prompt,
    setPrompt,
    evaluateModelId,
    setEvaluateModelId,
    optimizeModelId,
    setOptimizeModelId,
    evaluateTemperature,
    setEvaluateTemperature,
    optimizeTemperature,
    setOptimizeTemperature,
    evaluationResult,
    setEvaluationResult,
    optimizedPrompt,
    setOptimizedPrompt,
    evaluateResolvedModel,
    setEvaluateResolvedModel,
    optimizeResolvedModel,
    setOptimizeResolvedModel,
    evaluateContext,
    setEvaluateContext,
    saveDraft,
    setSaveDraft,
    fieldErrors,
    setFieldErrors,
    sendEvaluate,
    sendOptimize,
    sendRetrySave,
    evaluatePending,
    optimizePending,
    retryPending,
    modelOptions,
    settingsLoading,
    isEvaluateDisabled,
    isOptimizeDisabled,
    evaluateRequestSeqRef,
    optimizeRequestSeqRef,
    retrySaveRequestSeqRef,
  };
}

export type OptimizePageResource = ReturnType<typeof useOptimizePageResource>;
