import type { OptimizePageDeps } from "../types";
import type { OptimizePageResource } from "./use-optimize-page-resource";
import { useCallback } from "react";
import { writeClipboardText } from "@/lib/workbench-shell";

interface UseOptimizeCopyActionsDeps {
  resource: OptimizePageResource;
  onRequestError: OptimizePageDeps["onRequestError"];
}

export function useOptimizeCopyActions(deps: UseOptimizeCopyActionsDeps) {
  const { resource, onRequestError } = deps;

  const copyText = useCallback(async (text: string, successTitle: string) => {
    try {
      await writeClipboardText(text);
      resource.notice.success({
        title: successTitle,
        message: "内容已复制到剪贴板。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "复制失败",
      });
    }
  }, [onRequestError, resource.notice]);

  const copyEvaluation = useCallback(async () => {
    if (!resource.evaluationResult) {
      return;
    }

    await copyText(resource.evaluationResult, "评估结果已复制");
  }, [copyText, resource.evaluationResult]);

  const copyOptimized = useCallback(async () => {
    if (!resource.optimizedPrompt) {
      return;
    }

    await copyText(resource.optimizedPrompt, "优化结果已复制");
  }, [copyText, resource.optimizedPrompt]);

  return {
    copyEvaluation,
    copyOptimized,
  };
}
