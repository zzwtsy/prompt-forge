import type { ProviderSettingsActionDeps } from "./provider-settings-action-types";
import { useRequest } from "alova/client";
import { useCallback, useRef } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import { useWorkbenchToast } from "@/lib/workbench-shell";

export function useProviderSettingsSyncAction(deps: ProviderSettingsActionDeps) {
  const {
    selectedProvider,
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();
  const syncRequestSeqRef = useRef(0);

  const {
    loading: syncingModels,
    send: sendSyncProviderModels,
  } = useRequest((providerId: string) => modelSettingsMethods.syncProviderModels(providerId), {
    immediate: false,
  });

  const syncModels = useCallback(async () => {
    if (selectedProvider === null) {
      return;
    }

    const requestId = ++syncRequestSeqRef.current;

    try {
      await sendSyncProviderModels(selectedProvider.id);
      if (requestId !== syncRequestSeqRef.current) {
        return;
      }

      await reloadSettings(true);
      if (requestId !== syncRequestSeqRef.current) {
        return;
      }

      notice.success({
        title: "模型同步完成",
        message: "服务商模型列表已刷新。",
      });
    } catch (error) {
      if (requestId !== syncRequestSeqRef.current) {
        return;
      }

      onRequestError(error, {
        fallbackTitle: "同步模型失败",
      });
    }
  }, [notice, onRequestError, reloadSettings, selectedProvider, sendSyncProviderModels]);

  return {
    syncingModels,
    syncModels,
  };
}
