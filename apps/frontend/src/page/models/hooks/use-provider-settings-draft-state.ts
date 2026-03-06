import type {
  ModelSettingsValidationErrors,
  ProviderFormDraft,
} from "../types";
import type { ProviderItem } from "@/lib/workbench-api";
import { useCallback, useMemo, useState } from "react";

export type ProviderSettingsValidationErrors = Pick<ModelSettingsValidationErrors, "providerName" | "providerBaseUrl">;

export function createProviderDraft(provider: ProviderItem): ProviderFormDraft {
  return {
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: "",
    enabled: provider.enabled,
    clearApiKey: false,
  };
}

interface UseProviderSettingsDraftStateDeps {
  selectedProvider: ProviderItem | null;
}

export function useProviderSettingsDraftState(deps: UseProviderSettingsDraftStateDeps) {
  const { selectedProvider } = deps;

  const [providerDrafts, setProviderDrafts] = useState<Record<string, ProviderFormDraft>>({});
  const [validationErrors, setValidationErrors] = useState<ProviderSettingsValidationErrors>({});

  const selectedProviderDraft = useMemo(() => {
    if (selectedProvider === null) {
      return null;
    }

    return providerDrafts[selectedProvider.id] ?? createProviderDraft(selectedProvider);
  }, [providerDrafts, selectedProvider]);

  const updateSelectedProviderDraft = useCallback((updater: (draft: ProviderFormDraft) => ProviderFormDraft) => {
    if (selectedProvider === null) {
      return;
    }

    setProviderDrafts((previous) => {
      const current = previous[selectedProvider.id] ?? createProviderDraft(selectedProvider);

      return {
        ...previous,
        [selectedProvider.id]: updater(current),
      };
    });
  }, [selectedProvider]);

  const clearValidationError = useCallback((field: keyof ProviderSettingsValidationErrors) => {
    setValidationErrors(previous => ({
      ...previous,
      [field]: false,
    }));
  }, []);

  return {
    selectedProviderDraft,
    validationErrors,
    setValidationErrors,
    updateSelectedProviderDraft,
    clearValidationError,
  };
}
