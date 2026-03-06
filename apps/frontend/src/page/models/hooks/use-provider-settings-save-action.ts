import type { ProviderSettingsActionDeps } from "./provider-settings-action-types";
import type { ProviderSettingsValidationErrors } from "./use-provider-settings-draft-state";
import { useRequest } from "alova/client";
import { useCallback, useRef } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  hasField,
  useWorkbenchToast,
} from "@/lib/workbench-shell";
import { isValidUrl } from "../utils";

export function useProviderSettingsSaveAction(deps: ProviderSettingsActionDeps) {
  const {
    selectedProvider,
    selectedProviderDraft,
    onRequestError,
    reloadSettings,
    setValidationErrors,
    updateSelectedProviderDraft,
  } = deps;

  const notice = useWorkbenchToast();
  const saveRequestSeqRef = useRef(0);

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

  const saveProvider = useCallback(async () => {
    if (selectedProvider === null || selectedProviderDraft === null) {
      return;
    }

    const nextErrors: ProviderSettingsValidationErrors = {};

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

    const requestId = ++saveRequestSeqRef.current;

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
      if (requestId !== saveRequestSeqRef.current) {
        return;
      }

      await reloadSettings(true);
      if (requestId !== saveRequestSeqRef.current) {
        return;
      }

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
      if (requestId !== saveRequestSeqRef.current) {
        return;
      }

      onRequestError(error, {
        fallbackTitle: "更新服务商失败",
        onValidationError: (fields) => {
          const mapped: ProviderSettingsValidationErrors = {};

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
  }, [
    notice,
    onRequestError,
    reloadSettings,
    selectedProvider,
    selectedProviderDraft,
    sendSaveProviderSettings,
    setValidationErrors,
    updateSelectedProviderDraft,
  ]);

  return {
    savingProvider,
    saveProvider,
  };
}
