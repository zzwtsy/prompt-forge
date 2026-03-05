import type {
  CreateModelDialogSection,
  ModelSettingsSectionDeps,
  ModelSettingsValidationErrors,
} from "../types";
import type { ProviderItem } from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  hasField,
  useWorkbenchToast,
} from "@/lib/workbench-shell";

interface UseCreateModelDialogSectionDeps extends ModelSettingsSectionDeps {
  selectedProvider: ProviderItem | null;
}

export function useCreateModelDialogSection(deps: UseCreateModelDialogSectionDeps): CreateModelDialogSection {
  const {
    selectedProvider,
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();

  const [open, setOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    addModelName?: boolean;
  }>({});

  const {
    loading: addingModel,
    send: sendCreateModel,
  } = useRequest((payload: {
    providerId: string;
    modelName: string;
    displayName?: string;
  }) => modelSettingsMethods.createModel(payload), {
    immediate: false,
  });

  function resetDialogForm() {
    setModelName("");
    setDisplayName("");
    setValidationErrors({});
  }

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetDialogForm();
    }
  }

  async function createModel() {
    if (selectedProvider === null) {
      return;
    }

    const nextErrors: Pick<ModelSettingsValidationErrors, "addModelName"> = {};

    if (!modelName.trim()) {
      nextErrors.addModelName = true;
    }

    setValidationErrors(previous => ({
      ...previous,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "模型名称不能为空",
        message: "请填写模型名称后再提交。",
      });
      return;
    }

    try {
      await sendCreateModel({
        providerId: selectedProvider.id,
        modelName,
        displayName: displayName.trim() || undefined,
      });

      setOpen(false);
      resetDialogForm();

      await reloadSettings(true);

      notice.success({
        title: "模型创建成功",
        message: "已添加到当前服务商模型列表。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "创建模型失败",
        onValidationError: (fields) => {
          if (hasField(fields, ["modelName"])) {
            setValidationErrors(previous => ({
              ...previous,
              addModelName: true,
            }));
          }
        },
      });
    }
  }

  return {
    state: {
      open,
      modelName,
      displayName,
      validationErrors,
      providerAvailable: selectedProvider !== null,
      addingModel,
    },
    actions: {
      setOpen: setDialogOpen,
      setModelName: (value) => {
        setModelName(value);
        setValidationErrors(previous => ({
          ...previous,
          addModelName: false,
        }));
      },
      setDisplayName,
      createModel,
    },
  };
}
