import type {
  DefaultModelsSectionActions,
  DefaultModelsSectionState,
  ModelSettingsSectionDeps,
} from "../types";
import type {
  ModelDefaultsData,
  ProviderItem,
} from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  getEnabledModelOptions,
  MODEL_NONE_OPTION,
  useWorkbenchToast,
} from "@/lib/workbench-shell";

interface UseDefaultModelsSectionDeps extends ModelSettingsSectionDeps {
  providers: ProviderItem[];
  defaults: ModelDefaultsData;
  settingsLoading: boolean;
}

export function useDefaultModelsSection(deps: UseDefaultModelsSectionDeps): {
  state: DefaultModelsSectionState;
  actions: DefaultModelsSectionActions;
} {
  const {
    providers,
    defaults,
    settingsLoading,
    onRequestError,
    reloadSettings,
  } = deps;

  const notice = useWorkbenchToast();

  const [defaultsDraft, setDefaultsDraft] = useState<{
    evaluateModelId: string;
    optimizeModelId: string;
  } | null>(null);

  const {
    loading: savingDefaults,
    send: sendSaveDefaults,
  } = useRequest((payload: {
    evaluateModelId: string | null;
    optimizeModelId: string | null;
  }) => modelSettingsMethods.saveDefaults(payload), {
    immediate: false,
  });

  const defaultModelOptions = getEnabledModelOptions(providers);

  const defaultEvaluateModelId = defaultsDraft?.evaluateModelId
    ?? defaults.evaluateModelId
    ?? MODEL_NONE_OPTION;

  const defaultOptimizeModelId = defaultsDraft?.optimizeModelId
    ?? defaults.optimizeModelId
    ?? MODEL_NONE_OPTION;

  async function saveDefaults() {
    try {
      await sendSaveDefaults({
        evaluateModelId: defaultEvaluateModelId === MODEL_NONE_OPTION
          ? null
          : defaultEvaluateModelId,
        optimizeModelId: defaultOptimizeModelId === MODEL_NONE_OPTION
          ? null
          : defaultOptimizeModelId,
      });

      setDefaultsDraft(null);
      await reloadSettings(true);

      notice.success({
        title: "默认模型已更新",
        message: "评估与优化默认模型保存成功。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "保存默认模型失败",
      });
    }
  }

  return {
    state: {
      settingsLoading,
      defaultModelOptions,
      defaultEvaluateModelId,
      defaultOptimizeModelId,
      savingDefaults,
    },
    actions: {
      setDefaultEvaluateModelId: value => setDefaultsDraft(previous => ({
        evaluateModelId: value,
        optimizeModelId: previous?.optimizeModelId ?? defaultOptimizeModelId,
      })),
      setDefaultOptimizeModelId: value => setDefaultsDraft(previous => ({
        evaluateModelId: previous?.evaluateModelId ?? defaultEvaluateModelId,
        optimizeModelId: value,
      })),
      saveDefaults,
    },
  };
}
