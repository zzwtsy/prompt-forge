import type { ModelDefaultsData, ProviderItem } from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useEffect, useRef } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  unwrapResponseData,
  useWorkbenchErrorHandler,
} from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";

export function useWorkbenchBootstrap() {
  const setProviders = useWorkbenchShellStore(state => state.setProviders);
  const setDefaults = useWorkbenchShellStore(state => state.setDefaults);
  const setProvidersLoading = useWorkbenchShellStore(state => state.setProvidersLoading);
  const setDefaultsLoading = useWorkbenchShellStore(state => state.setDefaultsLoading);
  const { handleRequestError } = useWorkbenchErrorHandler();

  const {
    data: providersResponse,
    loading: providersLoading,
    error: providersError,
  } = useRequest(modelSettingsMethods.queryProviders, {
    immediate: true,
    force: true,
  });

  const {
    data: defaultsResponse,
    loading: defaultsLoading,
    error: defaultsError,
  } = useRequest(modelSettingsMethods.queryDefaults, {
    immediate: true,
    force: true,
  });

  useEffect(() => {
    setProvidersLoading(providersLoading);
  }, [providersLoading, setProvidersLoading]);

  useEffect(() => {
    setDefaultsLoading(defaultsLoading);
  }, [defaultsLoading, setDefaultsLoading]);

  useEffect(() => {
    const providersData = unwrapResponseData<{ providers: ProviderItem[] }>(providersResponse);
    setProviders(providersData?.providers ?? []);
  }, [providersResponse, setProviders]);

  useEffect(() => {
    const defaultsData = unwrapResponseData<ModelDefaultsData>(defaultsResponse);
    if (defaultsData != null) {
      setDefaults(defaultsData);
    }
  }, [defaultsResponse, setDefaults]);

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
}
