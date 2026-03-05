import type { ModelDefaultsData, ProviderItem } from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useCallback } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";
import { ModelSettingsTab } from "./components/model-settings-tab";

function unwrapResponseData<T>(response: T | { data: T }): T {
  return (typeof response === "object" && response !== null && "data" in response)
    ? response.data as T
    : response;
}

export function ModelsPage() {
  const providers = useWorkbenchShellStore(state => state.providers);
  const defaults = useWorkbenchShellStore(state => state.defaults);
  const providersLoading = useWorkbenchShellStore(state => state.providersLoading);
  const defaultsLoading = useWorkbenchShellStore(state => state.defaultsLoading);
  const setProviders = useWorkbenchShellStore(state => state.setProviders);
  const setDefaults = useWorkbenchShellStore(state => state.setDefaults);
  const setProvidersLoading = useWorkbenchShellStore(state => state.setProvidersLoading);
  const setDefaultsLoading = useWorkbenchShellStore(state => state.setDefaultsLoading);
  const { handleRequestError } = useWorkbenchErrorHandler();

  const { send: refreshProviders } = useRequest(() => modelSettingsMethods.queryProviders(), {
    immediate: false,
  });
  const { send: refreshDefaults } = useRequest(() => modelSettingsMethods.queryDefaults(), {
    immediate: false,
  });

  const refreshModelSettings = useCallback(async (silent = false) => {
    setProvidersLoading(true);
    setDefaultsLoading(true);

    try {
      const [providersResponse, defaultsResponse] = await Promise.all([
        refreshProviders(),
        refreshDefaults(),
      ]);

      const providersData = unwrapResponseData<{ providers: ProviderItem[] }>(providersResponse);
      const defaultsData = unwrapResponseData<ModelDefaultsData>(defaultsResponse);

      setProviders(providersData.providers);
      setDefaults(defaultsData);
      return true;
    } catch (error) {
      if (!silent) {
        handleRequestError(error, {
          fallbackTitle: "加载模型设置失败",
        });
      }
      return false;
    } finally {
      setProvidersLoading(false);
      setDefaultsLoading(false);
    }
  }, [
    handleRequestError,
    refreshDefaults,
    refreshProviders,
    setDefaults,
    setDefaultsLoading,
    setProviders,
    setProvidersLoading,
  ]);

  return (
    <ModelSettingsTab
      providers={providers}
      defaults={defaults}
      settingsLoading={providersLoading || defaultsLoading}
      refreshSettings={refreshModelSettings}
      onRequestError={handleRequestError}
    />
  );
}
