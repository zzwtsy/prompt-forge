import type { OptimizeSubmitActionDeps } from "./optimize-submit-action-types";
import type {
  OptimizeResponseData,
} from "@/lib/workbench-api";
import type { OptimizeFieldErrors } from "@/store";
import { useCallback } from "react";
import {
  hasField,
  MODEL_DEFAULT_OPTION,
  unwrapResponseData,
} from "@/lib/workbench-shell";
import { parseOptionalFloat } from "../utils";

export function useOptimizeOptimizeActions(deps: OptimizeSubmitActionDeps) {
  const { resource, onRequestError } = deps;

  const optimize = useCallback(async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!resource.prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedOptimizeTemperature = parseOptionalFloat(resource.optimizeTemperature);
    const invalidOptimizeTemperature = parsedOptimizeTemperature === "invalid"
      || (typeof parsedOptimizeTemperature === "number"
        && (parsedOptimizeTemperature < 0 || parsedOptimizeTemperature > 2));
    if (invalidOptimizeTemperature) {
      nextErrors.optimizeTemperature = true;
    }

    resource.setFieldErrors(previous => ({
      ...previous,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      resource.notice.warning({
        title: "参数不合法",
        message: "请先修正优化参数后再提交。",
      });
      return;
    }

    const requestId = ++resource.optimizeRequestSeqRef.current;

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
        prompt: resource.prompt.trim(),
      };

      if (resource.evaluationResult.trim().length > 0) {
        payload.evaluationResult = resource.evaluationResult;
      }

      if (resource.evaluateContext) {
        payload.evaluateContext = resource.evaluateContext;
      }

      if (resource.optimizeModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = resource.optimizeModelId;
      }

      if (typeof parsedOptimizeTemperature === "number") {
        payload.temperature = parsedOptimizeTemperature;
      }

      const data = unwrapResponseData<OptimizeResponseData>(await resource.sendOptimize(payload));
      if (requestId !== resource.optimizeRequestSeqRef.current) {
        return;
      }

      resource.setOptimizedPrompt(data.optimizedPrompt);
      resource.setOptimizeResolvedModel(data.resolvedModel);

      if (data.persistence.saved) {
        resource.setSaveDraft(null);
        resource.bumpHistoryRefreshToken();
        resource.notice.success({
          title: "优化完成",
          message: "优化结果已保存到历史记录。",
        });
      } else if (data.persistence.retryable && data.persistence.saveDraft) {
        resource.setSaveDraft(data.persistence.saveDraft);
        resource.notice.warning({
          title: "优化完成，保存待重试",
          message: "请点击“保存”完成历史记录补保存。",
        });
      } else {
        resource.setSaveDraft(null);
      }
    } catch (error) {
      if (requestId !== resource.optimizeRequestSeqRef.current) {
        return;
      }

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
          resource.setFieldErrors(previous => ({ ...previous, ...mapped }));
        },
      });
    }
  }, [onRequestError, resource]);

  const retrySave = useCallback(async () => {
    if (!resource.saveDraft) {
      return;
    }

    const requestId = ++resource.retrySaveRequestSeqRef.current;

    try {
      await resource.sendRetrySave(resource.saveDraft);
      if (requestId !== resource.retrySaveRequestSeqRef.current) {
        return;
      }

      resource.setSaveDraft(null);
      resource.bumpHistoryRefreshToken();
      resource.notice.success({
        title: "保存成功",
        message: "优化结果已补保存到历史记录。",
      });
    } catch (error) {
      if (requestId !== resource.retrySaveRequestSeqRef.current) {
        return;
      }

      onRequestError(error, {
        fallbackTitle: "保存失败",
      });
    }
  }, [onRequestError, resource]);

  return {
    optimize,
    retrySave,
  };
}
