import type { OptimizeSubmitActionDeps } from "./optimize-submit-action-types";
import type {
  EvaluateResponseData,
} from "@/lib/workbench-api";
import type { OptimizeFieldErrors } from "@/store";
import { useCallback } from "react";
import {
  hasField,
  MODEL_DEFAULT_OPTION,
  unwrapResponseData,
} from "@/lib/workbench-shell";
import { parseOptionalFloat } from "../utils";

export function useOptimizeEvaluateAction(deps: OptimizeSubmitActionDeps) {
  const { resource, onRequestError } = deps;

  return useCallback(async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!resource.prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedEvaluateTemperature = parseOptionalFloat(resource.evaluateTemperature);
    const invalidEvaluateTemperature = parsedEvaluateTemperature === "invalid"
      || (typeof parsedEvaluateTemperature === "number"
        && (parsedEvaluateTemperature < 0 || parsedEvaluateTemperature > 2));
    if (invalidEvaluateTemperature) {
      nextErrors.evaluateTemperature = true;
    }

    resource.setFieldErrors(previous => ({
      ...previous,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      resource.notice.warning({
        title: "参数不合法",
        message: "请先修正评估参数后再提交。",
      });
      return;
    }

    const requestId = ++resource.evaluateRequestSeqRef.current;

    try {
      const payload: {
        prompt: string;
        modelId?: string;
        temperature?: number;
      } = {
        prompt: resource.prompt.trim(),
      };

      if (resource.evaluateModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = resource.evaluateModelId;
      }

      if (typeof parsedEvaluateTemperature === "number") {
        payload.temperature = parsedEvaluateTemperature;
      }

      const data = unwrapResponseData<EvaluateResponseData>(await resource.sendEvaluate(payload));
      if (requestId !== resource.evaluateRequestSeqRef.current) {
        return;
      }

      resource.setEvaluationResult(data.evaluationResult);
      resource.setEvaluateResolvedModel(data.resolvedModel);
      resource.setOptimizedPrompt("");
      resource.setOptimizeResolvedModel(null);
      resource.setSaveDraft(null);

      resource.setEvaluateContext({
        modelId: data.resolvedModel.modelId,
        temperature: payload.temperature,
      });

      resource.notice.success({
        title: "评估完成",
        message: "评估结果已更新，可以继续执行优化。",
      });
    } catch (error) {
      if (requestId !== resource.evaluateRequestSeqRef.current) {
        return;
      }

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
          resource.setFieldErrors(previous => ({ ...previous, ...mapped }));
        },
      });
    }
  }, [onRequestError, resource]);
}
