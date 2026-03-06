import type {
  OptimizePageActions,
  OptimizePageDeps,
  OptimizePageState,
} from "../types";
import type {
  EvaluateResponseData,
  OptimizeResponseData,
} from "@/lib/workbench-api";
import type { OptimizeFieldErrors } from "@/store";
import { useRequest } from "alova/client";
import { useCallback, useMemo } from "react";
import {
  promptRuntimeMethods,
  savedPromptsMethods,
} from "@/lib/workbench-api";
import {
  getEnabledModelOptions,
  hasField,
  MODEL_DEFAULT_OPTION,
  unwrapResponseData,
  useWorkbenchToast,
  writeClipboardText,
} from "@/lib/workbench-shell";
import {
  useOptimizeSessionStore,
  useWorkbenchShellStore,
} from "@/store";
import { parseOptionalFloat } from "../utils";

export function useOptimizePageState(deps: OptimizePageDeps): {
  state: OptimizePageState;
  actions: OptimizePageActions;
} {
  const { onRequestError } = deps;
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

  const isEvaluateDisabled = prompt.trim().length === 0 || evaluatePending || optimizePending;
  const isOptimizeDisabled = evaluationResult.trim().length === 0 || optimizePending || evaluatePending;

  const clearFieldError = useCallback((field: keyof OptimizeFieldErrors) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: false,
    }));
  }, [setFieldErrors]);

  const evaluate = useCallback(async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedEvaluateTemperature = parseOptionalFloat(evaluateTemperature);
    const invalidEvaluateTemperature = parsedEvaluateTemperature === "invalid"
      || (typeof parsedEvaluateTemperature === "number"
        && (parsedEvaluateTemperature < 0 || parsedEvaluateTemperature > 2));
    if (invalidEvaluateTemperature) {
      nextErrors.evaluateTemperature = true;
    }

    setFieldErrors(prev => ({
      ...prev,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "参数不合法",
        message: "请先修正评估参数后再提交。",
      });
      return;
    }

    try {
      const payload: {
        prompt: string;
        modelId?: string;
        temperature?: number;
      } = {
        prompt: prompt.trim(),
      };

      if (evaluateModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = evaluateModelId;
      }

      if (typeof parsedEvaluateTemperature === "number") {
        payload.temperature = parsedEvaluateTemperature;
      }

      const data = unwrapResponseData<EvaluateResponseData>(await sendEvaluate(payload));

      setEvaluationResult(data.evaluationResult);
      setEvaluateResolvedModel(data.resolvedModel);
      setOptimizedPrompt("");
      setOptimizeResolvedModel(null);
      setSaveDraft(null);

      setEvaluateContext({
        modelId: data.resolvedModel.modelId,
        temperature: payload.temperature,
      });

      notice.success({
        title: "评估完成",
        message: "评估结果已更新，可以继续执行优化。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "评估失败",
        onValidationError: (fields) => {
          const mapped: OptimizeFieldErrors = {};
          if (hasField(fields, ["prompt"])) {
            mapped.prompt = true;
          }
          if (hasField(fields, ["temperature"])) {
            mapped.evaluateTemperature = true;
          }
          setFieldErrors(prev => ({ ...prev, ...mapped }));
        },
      });
    }
  }, [
    evaluateModelId,
    evaluateTemperature,
    notice,
    onRequestError,
    prompt,
    sendEvaluate,
    setEvaluateContext,
    setEvaluateResolvedModel,
    setEvaluationResult,
    setFieldErrors,
    setOptimizeResolvedModel,
    setOptimizedPrompt,
    setSaveDraft,
  ]);

  const optimize = useCallback(async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedOptimizeTemperature = parseOptionalFloat(optimizeTemperature);
    const invalidOptimizeTemperature = parsedOptimizeTemperature === "invalid"
      || (typeof parsedOptimizeTemperature === "number"
        && (parsedOptimizeTemperature < 0 || parsedOptimizeTemperature > 2));
    if (invalidOptimizeTemperature) {
      nextErrors.optimizeTemperature = true;
    }

    setFieldErrors(prev => ({
      ...prev,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "参数不合法",
        message: "请先修正优化参数后再提交。",
      });
      return;
    }

    try {
      const payload: {
        prompt: string;
        evaluationResult?: string;
        modelId?: string;
        temperature?: number;
        evaluateContext?: {
          modelId: string;
          temperature?: number;
        };
      } = {
        prompt: prompt.trim(),
      };

      if (evaluationResult.trim().length > 0) {
        payload.evaluationResult = evaluationResult;
      }

      if (evaluateContext) {
        payload.evaluateContext = evaluateContext;
      }

      if (optimizeModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = optimizeModelId;
      }

      if (typeof parsedOptimizeTemperature === "number") {
        payload.temperature = parsedOptimizeTemperature;
      }

      const data = unwrapResponseData<OptimizeResponseData>(await sendOptimize(payload));

      setOptimizedPrompt(data.optimizedPrompt);
      setOptimizeResolvedModel(data.resolvedModel);

      if (data.persistence.saved) {
        setSaveDraft(null);
        bumpHistoryRefreshToken();
        notice.success({
          title: "优化完成",
          message: "优化结果已保存到历史记录。",
        });
      } else if (data.persistence.retryable && data.persistence.saveDraft) {
        setSaveDraft(data.persistence.saveDraft);
        notice.warning({
          title: "优化完成，保存待重试",
          message: "请点击“保存”完成历史记录补保存。",
        });
      } else {
        setSaveDraft(null);
      }
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "优化失败",
        onValidationError: (fields) => {
          const mapped: OptimizeFieldErrors = {};
          if (hasField(fields, ["prompt"])) {
            mapped.prompt = true;
          }
          if (hasField(fields, ["temperature"])) {
            mapped.optimizeTemperature = true;
          }
          setFieldErrors(prev => ({ ...prev, ...mapped }));
        },
      });
    }
  }, [
    bumpHistoryRefreshToken,
    evaluationResult,
    evaluateContext,
    notice,
    onRequestError,
    optimizeModelId,
    optimizeTemperature,
    prompt,
    sendOptimize,
    setFieldErrors,
    setOptimizeResolvedModel,
    setOptimizedPrompt,
    setSaveDraft,
  ]);

  const retrySave = useCallback(async () => {
    if (!saveDraft) {
      return;
    }

    try {
      await sendRetrySave(saveDraft);

      setSaveDraft(null);
      bumpHistoryRefreshToken();
      notice.success({
        title: "保存成功",
        message: "优化结果已补保存到历史记录。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "保存失败",
      });
    }
  }, [bumpHistoryRefreshToken, notice, onRequestError, saveDraft, sendRetrySave, setSaveDraft]);

  const copyText = useCallback(async (text: string, successTitle: string) => {
    try {
      await writeClipboardText(text);
      notice.success({
        title: successTitle,
        message: "内容已复制到剪贴板。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "复制失败",
      });
    }
  }, [notice, onRequestError]);

  return {
    state: {
      prompt,
      evaluateModelId,
      optimizeModelId,
      evaluateTemperature,
      optimizeTemperature,
      evaluationResult,
      optimizedPrompt,
      evaluateResolvedModel,
      optimizeResolvedModel,
      saveDraft,
      fieldErrors,
      modelOptions,
      settingsLoading: providersLoading || defaultsLoading,
      evaluatePending,
      optimizePending,
      retryPending,
      isEvaluateDisabled,
      isOptimizeDisabled,
    },
    actions: {
      setPrompt: (value) => {
        setPrompt(value);
        clearFieldError("prompt");
      },
      setEvaluateModelId,
      setOptimizeModelId,
      setEvaluateTemperature: (value) => {
        setEvaluateTemperature(value);
        clearFieldError("evaluateTemperature");
      },
      setOptimizeTemperature: (value) => {
        setOptimizeTemperature(value);
        clearFieldError("optimizeTemperature");
      },
      evaluate,
      optimize,
      retrySave,
      copyEvaluation: async () => {
        if (!evaluationResult) {
          return;
        }
        await copyText(evaluationResult, "评估结果已复制");
      },
      copyOptimized: async () => {
        if (!optimizedPrompt) {
          return;
        }
        await copyText(optimizedPrompt, "优化结果已复制");
      },
    },
  };
}
