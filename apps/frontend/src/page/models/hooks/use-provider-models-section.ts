import type {
  ModelSettingsSectionDeps,
  ProviderModelsSection,
} from "../types";
import type {
  ModelItem,
  ProviderItem,
} from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import { useWorkbenchToast } from "@/lib/workbench-shell";

interface UseProviderModelsSectionDeps extends ModelSettingsSectionDeps {
  selectedProvider: ProviderItem | null;
}

export function useProviderModelsSection(deps: UseProviderModelsSectionDeps): ProviderModelsSection {
  const {
    selectedProvider,
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();

  const [modelSearch, setModelSearch] = useState("");
  const [modelDisplayDrafts, setModelDisplayDrafts] = useState<Record<string, string>>({});
  const [togglingModelIds, setTogglingModelIds] = useState<Set<string>>(() => new Set());
  const [savingDisplayNameIds, setSavingDisplayNameIds] = useState<Set<string>>(() => new Set());

  const { send: sendSaveModel } = useRequest((payload: {
    modelId: string;
    data: {
      enabled?: boolean;
      displayName?: string | null;
    };
  }) => modelSettingsMethods.saveModel(payload), {
    immediate: false,
  });

  const sortedModels = selectedProvider === null
    ? []
    : [...selectedProvider.models].sort((left, right) => {
        if (left.enabled !== right.enabled) {
          return left.enabled ? -1 : 1;
        }

        return left.modelName.localeCompare(right.modelName, "zh-CN");
      });

  const keyword = modelSearch.trim().toLowerCase();
  const filteredModels = keyword.length === 0
    ? sortedModels
    : sortedModels.filter((model) => {
        const displayName = model.displayName ?? "";
        return model.modelName.toLowerCase().includes(keyword)
          || displayName.toLowerCase().includes(keyword);
      });

  async function toggleModel(model: ModelItem) {
    setTogglingModelIds(previous => new Set(previous).add(model.id));

    try {
      await sendSaveModel({
        modelId: model.id,
        data: {
          enabled: !model.enabled,
        },
      });

      await reloadSettings(true);

      notice.success({
        title: "模型状态已更新",
        message: `${model.modelName} 已${model.enabled ? "禁用" : "启用"}。`,
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "更新模型状态失败",
      });
    } finally {
      setTogglingModelIds((previous) => {
        const next = new Set(previous);
        next.delete(model.id);
        return next;
      });
    }
  }

  async function saveModelDisplayName(model: ModelItem) {
    setSavingDisplayNameIds(previous => new Set(previous).add(model.id));

    try {
      const nextDisplayName = (modelDisplayDrafts[model.id] ?? model.displayName ?? "").trim();

      await sendSaveModel({
        modelId: model.id,
        data: {
          displayName: nextDisplayName.length > 0 ? nextDisplayName : null,
        },
      });

      await reloadSettings(true);

      notice.success({
        title: "模型显示名已更新",
        message: `${model.modelName} 的显示名已保存。`,
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "更新模型显示名失败",
      });
    } finally {
      setSavingDisplayNameIds((previous) => {
        const next = new Set(previous);
        next.delete(model.id);
        return next;
      });
    }
  }

  return {
    state: {
      modelSearch,
      filteredModels,
      modelDisplayDrafts,
      togglingModelIds,
      savingDisplayNameIds,
    },
    actions: {
      setModelSearch,
      toggleModel,
      setModelDisplayDraft: (modelId, value) => {
        setModelDisplayDrafts(previous => ({
          ...previous,
          [modelId]: value,
        }));
      },
      saveModelDisplayName,
    },
  };
}
