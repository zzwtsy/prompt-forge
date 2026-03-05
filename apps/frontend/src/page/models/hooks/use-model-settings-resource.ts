import type {
  ModelDefaultsData,
  ProviderItem,
} from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";
import { useRequest } from "alova/client";
import { modelSettingsMethods } from "@/lib/workbench-api";
import { unwrapResponseData } from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";

interface UseModelSettingsResourceDeps {
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
}

export function useModelSettingsResource(deps: UseModelSettingsResourceDeps) {
  const { onRequestError } = deps;

  const providers = useWorkbenchShellStore(state => state.providers);
  const defaults = useWorkbenchShellStore(state => state.defaults);
  const providersLoading = useWorkbenchShellStore(state => state.providersLoading);
  const defaultsLoading = useWorkbenchShellStore(state => state.defaultsLoading);
  const setProviders = useWorkbenchShellStore(state => state.setProviders);
  const setDefaults = useWorkbenchShellStore(state => state.setDefaults);
  const setProvidersLoading = useWorkbenchShellStore(state => state.setProvidersLoading);
  const setDefaultsLoading = useWorkbenchShellStore(state => state.setDefaultsLoading);

  const { send: refreshProviders } = useRequest(modelSettingsMethods.queryProviders, {
    immediate: false,
    force: true,
  });

  const { send: refreshDefaults } = useRequest(modelSettingsMethods.queryDefaults, {
    immediate: false,
    force: true,
  });

  async function reloadSettings(silent = false) {
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
        onRequestError(error, {
          fallbackTitle: "加载模型设置失败",
        });
      }
      return false;
    } finally {
      setProvidersLoading(false);
      setDefaultsLoading(false);
    }
  }

  return {
    providers,
    defaults,
    providersLoading,
    defaultsLoading,
    settingsLoading: providersLoading || defaultsLoading,
    reloadSettings,
  };
}
