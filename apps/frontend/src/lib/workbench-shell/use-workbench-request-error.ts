import type {
  RequestErrorOptions,
  WorkbenchTab,
} from "./types";
import { useCallback } from "react";
import {
  extractValidationFieldPaths,
  normalizeClientError,
} from "@/lib/api-envelope";
import { useWorkbenchToast } from "./workbench-toast";

interface UseRequestErrorOptions {
  navigateToTab: (tab: WorkbenchTab) => void;
  redirectToLogin: () => void;
}

export function useWorkbenchRequestError(options: UseRequestErrorOptions) {
  const { navigateToTab, redirectToLogin } = options;
  const notice = useWorkbenchToast();

  const handleRequestError = useCallback((error: unknown, requestOptions: RequestErrorOptions) => {
    const normalized = normalizeClientError(error);

    if (normalized.code === 30001 && requestOptions.onValidationError) {
      requestOptions.onValidationError(extractValidationFieldPaths(normalized.details));
    }

    if (normalized.code === 40101 || normalized.code === 40301) {
      redirectToLogin();
      return;
    }

    if (normalized.code === 22004) {
      notice.warning({
        title: "默认模型不可用",
        message: "请先在模型设置中修复默认模型后再继续。",
        action: {
          label: "前往模型设置",
          onClick: () => navigateToTab("models"),
        },
      });
      return;
    }

    if (normalized.code === 22005) {
      notice.warning({
        title: "服务商 API Key 未配置",
        message: "请先在模型设置中补齐 API Key。",
        action: {
          label: "前往模型设置",
          onClick: () => navigateToTab("models"),
        },
      });
      return;
    }

    if (normalized.code === 32101) {
      notice.warning({
        title: "保存草稿失效",
        message: "保存草稿无效或已过期，请重新执行优化后再保存。",
      });
      return;
    }

    if (normalized.code === 30001) {
      notice.warning({
        title: "参数校验失败",
        message: "输入参数不合法，请检查标红字段后重试。",
      });
      return;
    }

    notice.error({
      title: requestOptions.fallbackTitle,
      message: normalized.message,
    });
  }, [navigateToTab, notice, redirectToLogin]);

  return {
    handleRequestError,
  };
}
