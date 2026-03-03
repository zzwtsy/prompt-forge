import type { ReactNode } from "react";
import type { ModelDefaultsData, NoticeInput, ProviderItem, WorkbenchTab } from "../../types";
import type { WorkbenchShellValue } from "./workbench-shell-context";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useRequest } from "alova/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLoginRedirectTarget } from "@/lib/auth-redirect";
import { WORKBENCH_TAB_PATHS } from "../../constants";
import { useWorkbenchRequestError } from "../../hooks/use-workbench-request-error";
import { modelSettingsMethods } from "../../services/model-settings.service";
import { WorkbenchShellContext } from "./workbench-shell-context";

const EMPTY_DEFAULTS: ModelDefaultsData = {
  evaluateModelId: null,
  optimizeModelId: null,
};

function unwrapResponseData<T>(response: T | { data: T } | undefined): T | undefined {
  if (response === undefined) {
    return undefined;
  }

  return (typeof response === "object" && response !== null && "data" in response)
    ? response.data as T
    : response;
}

interface WorkbenchShellProviderProps {
  children: ReactNode;
}

export function WorkbenchShellProvider({ children }: WorkbenchShellProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notice, setNotice] = useState<WorkbenchShellValue["notice"]>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  const {
    data: providersResponse,
    loading: providersLoading,
    error: providersError,
    send: refreshProviders,
  } = useRequest(() => modelSettingsMethods.queryProviders(), { immediate: true });

  const {
    data: defaultsData,
    loading: defaultsLoading,
    error: defaultsError,
    send: refreshDefaults,
  } = useRequest(() => modelSettingsMethods.queryDefaults(), { immediate: true });

  const providersData = unwrapResponseData<{ providers: ProviderItem[] }>(providersResponse);
  const providers = useMemo(() => {
    return providersData?.providers ?? [];
  }, [providersData]);
  const defaults = unwrapResponseData<ModelDefaultsData>(defaultsData) ?? EMPTY_DEFAULTS;
  const settingsLoading = providersLoading || defaultsLoading;

  const showNotice = useCallback((input: NoticeInput) => {
    setNotice({
      id: Date.now(),
      ...input,
    });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const navigateToTab = useCallback((tab: WorkbenchTab) => {
    void navigate({
      to: WORKBENCH_TAB_PATHS[tab],
    });
  }, [navigate]);

  const redirectToLogin = useCallback(() => {
    void navigate({
      to: "/login",
      search: {
        redirect: buildLoginRedirectTarget(location),
      },
      replace: true,
    });
  }, [location, navigate]);

  const { handleRequestError } = useWorkbenchRequestError({
    showNotice,
    navigateToTab,
    redirectToLogin,
  });

  const refreshModelSettings = useCallback(async (silent = false) => {
    try {
      await Promise.all([
        refreshProviders(),
        refreshDefaults(),
      ]);
      return true;
    } catch (error) {
      if (!silent) {
        handleRequestError(error, {
          fallbackTitle: "加载模型设置失败",
        });
      }
      return false;
    }
  }, [handleRequestError, refreshDefaults, refreshProviders]);

  const lastInitialErrorRef = useRef<unknown>(null);
  useEffect(() => {
    const error = providersError ?? defaultsError;
    if (error == null || lastInitialErrorRef.current === error) {
      return;
    }

    lastInitialErrorRef.current = error;
    handleRequestError(error, {
      fallbackTitle: "加载模型设置失败",
    });
  }, [defaultsError, handleRequestError, providersError]);

  const bumpHistoryRefreshToken = useCallback(() => {
    setHistoryRefreshToken(previous => previous + 1);
  }, []);

  const value = useMemo<WorkbenchShellValue>(() => {
    return {
      providers,
      defaults,
      settingsLoading,
      notice,
      showNotice,
      clearNotice,
      handleRequestError,
      refreshModelSettings,
      historyRefreshToken,
      bumpHistoryRefreshToken,
    };
  }, [
    providers,
    defaults,
    settingsLoading,
    notice,
    showNotice,
    clearNotice,
    handleRequestError,
    refreshModelSettings,
    historyRefreshToken,
    bumpHistoryRefreshToken,
  ]);

  return (
    <WorkbenchShellContext value={value}>
      {children}
    </WorkbenchShellContext>
  );
}
