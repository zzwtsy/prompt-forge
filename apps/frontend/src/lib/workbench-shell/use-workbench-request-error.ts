import type {
  NoticeInput,
  RequestErrorOptions,
  WorkbenchTab,
} from "./types";
import { useCallback } from "react";
import {
  extractValidationFieldPaths,
  normalizeClientError,
} from "@/lib/api-envelope";

interface UseRequestErrorOptions {
  showNotice: (input: NoticeInput) => void;
  navigateToTab: (tab: WorkbenchTab) => void;
  redirectToLogin: () => void;
}

export function useWorkbenchRequestError(options: UseRequestErrorOptions) {
  const { showNotice, navigateToTab, redirectToLogin } = options;

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
      showNotice({
        tone: "warning",
        title: "默认模型不可用",
        message: "请先在模型设置中修复默认模型后再继续。",
        actionLabel: "前往模型设置",
        onAction: () => navigateToTab("models"),
      });
      return;
    }

    if (normalized.code === 22005) {
      showNotice({
        tone: "warning",
        title: "服务商 API Key 未配置",
        message: "请先在模型设置中补齐 API Key。",
        actionLabel: "前往模型设置",
        onAction: () => navigateToTab("models"),
      });
      return;
    }

    if (normalized.code === 32101) {
      showNotice({
        tone: "warning",
        title: "保存草稿失效",
        message: "保存草稿无效或已过期，请重新执行优化后再保存。",
      });
      return;
    }

    if (normalized.code === 30001) {
      showNotice({
        tone: "warning",
        title: "参数校验失败",
        message: "输入参数不合法，请检查标红字段后重试。",
      });
      return;
    }

    showNotice({
      tone: "error",
      title: requestOptions.fallbackTitle,
      message: normalized.message,
    });
  }, [navigateToTab, redirectToLogin, showNotice]);

  return {
    handleRequestError,
  };
}
