import type {
  ModelSettingsSectionDeps,
  ModelSettingsValidationErrors,
  ProviderFormDraft,
  ProviderSettingsSectionActions,
  ProviderSettingsSectionState,
} from "../types";
import type {
  ProviderItem,
} from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  hasField,
  useWorkbenchToast,
} from "@/lib/workbench-shell";
import { isValidUrl } from "../utils";

interface UseProviderSettingsSectionDeps extends ModelSettingsSectionDeps {
  selectedProvider: ProviderItem | null;
  settingsLoading: boolean;
}

function createProviderDraft(provider: ProviderItem): ProviderFormDraft {
  return {
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: "",
    enabled: provider.enabled,
    clearApiKey: false,
  };
}

export function useProviderSettingsSection(deps: UseProviderSettingsSectionDeps): {
  state: ProviderSettingsSectionState;
  actions: ProviderSettingsSectionActions;
} {
  const {
    selectedProvider,
    settingsLoading,
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();

  const [providerDrafts, setProviderDrafts] = useState<Record<string, ProviderFormDraft>>({});
  const [validationErrors, setValidationErrors] = useState<{
    providerName?: boolean;
    providerBaseUrl?: boolean;
  }>({});

  const {
    loading: savingProvider,
    send: sendSaveProviderSettings,
  } = useRequest((payload: {
    providerId: string;
    data: {
      name: string;
      baseUrl: string;
      enabled: boolean;
      apiKey?: string;
    };
  }) => modelSettingsMethods.saveProviderSettings(payload), {
    immediate: false,
  });

  const {
    loading: syncingModels,
    send: sendSyncProviderModels,
  } = useRequest((providerId: string) => modelSettingsMethods.syncProviderModels(providerId), {
    immediate: false,
  });

  const selectedProviderDraft = selectedProvider === null
    ? null
    : providerDrafts[selectedProvider.id] ?? createProviderDraft(selectedProvider);

  function updateSelectedProviderDraft(updater: (draft: ProviderFormDraft) => ProviderFormDraft) {
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
  }

  function clearValidationError(field: "providerName" | "providerBaseUrl") {
    setValidationErrors(previous => ({
      ...previous,
      [field]: false,
    }));
  }

  async function saveProvider() {
    if (selectedProvider === null || selectedProviderDraft === null) {
      return;
    }

    const nextErrors: Pick<ModelSettingsValidationErrors, "providerName" | "providerBaseUrl"> = {};

    if (!selectedProviderDraft.name.trim()) {
      nextErrors.providerName = true;
    }

    if (!selectedProviderDraft.baseUrl.trim() || !isValidUrl(selectedProviderDraft.baseUrl.trim())) {
      nextErrors.providerBaseUrl = true;
    }

    setValidationErrors(previous => ({
      ...previous,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "服务商参数不合法",
        message: "请先修正服务商名称或 BaseURL。",
      });
      return;
    }

    try {
      const payload: {
        name: string;
        baseUrl: string;
        enabled: boolean;
        apiKey?: string;
      } = {
        name: selectedProviderDraft.name,
        baseUrl: selectedProviderDraft.baseUrl,
        enabled: selectedProviderDraft.enabled,
      };

      if (selectedProviderDraft.clearApiKey) {
        payload.apiKey = "";
      } else if (selectedProviderDraft.apiKey.trim()) {
        payload.apiKey = selectedProviderDraft.apiKey.trim();
      }

      await sendSaveProviderSettings({
        providerId: selectedProvider.id,
        data: payload,
      });

      await reloadSettings(true);

      updateSelectedProviderDraft(previous => ({
        ...previous,
        apiKey: "",
        clearApiKey: false,
      }));

      notice.success({
        title: "服务商已更新",
        message: "服务商配置与启用状态已保存。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "更新服务商失败",
        onValidationError: (fields) => {
          const mapped: Pick<ModelSettingsValidationErrors, "providerName" | "providerBaseUrl"> = {};

          if (hasField(fields, ["name"])) {
            mapped.providerName = true;
          }

          if (hasField(fields, ["baseUrl"])) {
            mapped.providerBaseUrl = true;
          }

          setValidationErrors(previous => ({
            ...previous,
            ...mapped,
          }));
        },
      });
    }
  }

  async function syncModels() {
    if (selectedProvider === null) {
      return;
    }

    try {
      await sendSyncProviderModels(selectedProvider.id);
      await reloadSettings(true);

      notice.success({
        title: "模型同步完成",
        message: "服务商模型列表已刷新。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "同步模型失败",
      });
    }
  }

  return {
    state: {
      selectedProvider,
      selectedProviderDraft,
      validationErrors,
      savingProvider,
      syncingModels,
      settingsLoading,
    },
    actions: {
      setSelectedProviderName: (value) => {
        updateSelectedProviderDraft(previous => ({
          ...previous,
          name: value,
        }));
        clearValidationError("providerName");
      },
      setSelectedProviderBaseUrl: (value) => {
        updateSelectedProviderDraft(previous => ({
          ...previous,
          baseUrl: value,
        }));
        clearValidationError("providerBaseUrl");
      },
      setSelectedProviderApiKey: value => updateSelectedProviderDraft(previous => ({
        ...previous,
        apiKey: value,
        clearApiKey: false,
      })),
      toggleSelectedProviderEnabled: () => updateSelectedProviderDraft(previous => ({
        ...previous,
        enabled: !previous.enabled,
      })),
      toggleSelectedProviderClearApiKey: () => updateSelectedProviderDraft(previous => ({
        ...previous,
        clearApiKey: !previous.clearApiKey,
      })),
      saveProvider,
      syncModels,
    },
  };
}
