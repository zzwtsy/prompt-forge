import type { ProviderSettingsActionDeps } from "./provider-settings-action-types";
import { useProviderSettingsSaveAction } from "./use-provider-settings-save-action";
import { useProviderSettingsSyncAction } from "./use-provider-settings-sync-action";

export function useProviderSettingsActions(deps: ProviderSettingsActionDeps) {
  const {
    savingProvider,
    saveProvider,
  } = useProviderSettingsSaveAction(deps);

  const {
    syncingModels,
    syncModels,
  } = useProviderSettingsSyncAction(deps);

  return {
    savingProvider,
    syncingModels,
    saveProvider,
    syncModels,
  };
}
