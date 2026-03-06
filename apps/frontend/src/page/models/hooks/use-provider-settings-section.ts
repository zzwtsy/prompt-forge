import type {
  ModelSettingsSectionDeps,
  ProviderSettingsSection,
} from "../types";
import type {
  ProviderItem,
} from "@/lib/workbench-api";
import { useProviderSettingsActions } from "./use-provider-settings-actions";
import { useProviderSettingsDraftState } from "./use-provider-settings-draft-state";

interface UseProviderSettingsSectionDeps extends ModelSettingsSectionDeps {
  selectedProvider: ProviderItem | null;
  settingsLoading: boolean;
}

export function useProviderSettingsSection(deps: UseProviderSettingsSectionDeps): ProviderSettingsSection {
  const {
    selectedProvider,
    settingsLoading,
    onRequestError,
    reloadSettings,
  } = deps;

  const draftState = useProviderSettingsDraftState({
    selectedProvider,
  });

  const requestActions = useProviderSettingsActions({
    selectedProvider,
    selectedProviderDraft: draftState.selectedProviderDraft,
    onRequestError,
    reloadSettings,
    setValidationErrors: draftState.setValidationErrors,
    updateSelectedProviderDraft: draftState.updateSelectedProviderDraft,
  });

  return {
    state: {
      selectedProvider,
      selectedProviderDraft: draftState.selectedProviderDraft,
      validationErrors: draftState.validationErrors,
      savingProvider: requestActions.savingProvider,
      syncingModels: requestActions.syncingModels,
      settingsLoading,
    },
    actions: {
      setSelectedProviderName: (value) => {
        draftState.updateSelectedProviderDraft(previous => ({
          ...previous,
          name: value,
        }));
        draftState.clearValidationError("providerName");
      },
      setSelectedProviderBaseUrl: (value) => {
        draftState.updateSelectedProviderDraft(previous => ({
          ...previous,
          baseUrl: value,
        }));
        draftState.clearValidationError("providerBaseUrl");
      },
      setSelectedProviderApiKey: value => draftState.updateSelectedProviderDraft(previous => ({
        ...previous,
        apiKey: value,
        clearApiKey: false,
      })),
      toggleSelectedProviderEnabled: () => draftState.updateSelectedProviderDraft(previous => ({
        ...previous,
        enabled: !previous.enabled,
      })),
      toggleSelectedProviderClearApiKey: () => draftState.updateSelectedProviderDraft(previous => ({
        ...previous,
        clearApiKey: !previous.clearApiKey,
      })),
      saveProvider: requestActions.saveProvider,
      syncModels: requestActions.syncModels,
    },
  };
}
