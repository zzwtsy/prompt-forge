import type {
  CreateProviderDialogSectionActions,
  CreateProviderDialogSectionState,
  ModelSettingsSectionDeps,
  ModelSettingsValidationErrors,
} from "../types";
import { useRequest } from "alova/client";
import { useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  hasField,
  useWorkbenchToast,
} from "@/lib/workbench-shell";
import { isValidUrl } from "../utils";

export function useCreateProviderDialogSection(deps: ModelSettingsSectionDeps): {
  state: CreateProviderDialogSectionState;
  actions: CreateProviderDialogSectionActions;
} {
  const {
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    addProviderName?: boolean;
    addProviderBaseUrl?: boolean;
  }>({});

  const {
    loading: addingProvider,
    send: sendCreateProvider,
  } = useRequest((payload: {
    name: string;
    baseUrl: string;
    apiKey?: string;
  }) => modelSettingsMethods.createOpenAICompatibleProvider(payload), {
    immediate: false,
  });

  function resetDialogForm() {
    setName("");
    setBaseUrl("");
    setApiKey("");
    setValidationErrors({});
  }

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetDialogForm();
    }
  }

  async function createProvider() {
    const nextErrors: Pick<ModelSettingsValidationErrors, "addProviderName" | "addProviderBaseUrl"> = {};

    if (!name.trim()) {
      nextErrors.addProviderName = true;
    }

    if (!baseUrl.trim() || !isValidUrl(baseUrl.trim())) {
      nextErrors.addProviderBaseUrl = true;
    }

    setValidationErrors(previous => ({
      ...previous,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "新增服务商参数不合法",
        message: "请检查服务商名称与 BaseURL。",
      });
      return;
    }

    try {
      await sendCreateProvider({
        name,
        baseUrl,
        apiKey,
      });

      setOpen(false);
      resetDialogForm();

      await reloadSettings(true);

      notice.success({
        title: "服务商创建成功",
        message: "新服务商已加入列表。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "创建服务商失败",
        onValidationError: (fields) => {
          const mapped: Pick<ModelSettingsValidationErrors, "addProviderName" | "addProviderBaseUrl"> = {};

          if (hasField(fields, ["name"])) {
            mapped.addProviderName = true;
          }

          if (hasField(fields, ["baseUrl"])) {
            mapped.addProviderBaseUrl = true;
          }

          setValidationErrors(previous => ({
            ...previous,
            ...mapped,
          }));
        },
      });
    }
  }

  return {
    state: {
      open,
      name,
      baseUrl,
      apiKey,
      validationErrors,
      addingProvider,
    },
    actions: {
      setOpen: setDialogOpen,
      setName: (value) => {
        setName(value);
        setValidationErrors(previous => ({
          ...previous,
          addProviderName: false,
        }));
      },
      setBaseUrl: (value) => {
        setBaseUrl(value);
        setValidationErrors(previous => ({
          ...previous,
          addProviderBaseUrl: false,
        }));
      },
      setApiKey,
      createProvider,
    },
  };
}
