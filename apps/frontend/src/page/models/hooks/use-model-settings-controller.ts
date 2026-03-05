import type {
  ModelSettingsControllerActions,
  ModelSettingsControllerState,
  ModelSettingsValidationErrors,
  ProviderFormDraft,
} from "../types";
import type {
  ModelDefaultsData,
  ModelItem,
  ProviderItem,
} from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";
import { useRequest } from "alova/client";
import { useCallback, useMemo, useState } from "react";
import { modelSettingsMethods } from "@/lib/workbench-api";
import {
  getEnabledModelOptions,
  hasField,
  MODEL_NONE_OPTION,
  unwrapResponseData,
  useWorkbenchToast,
} from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";
import { isValidUrl } from "../utils";

interface UseModelSettingsControllerDeps {
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
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

export function useModelSettingsController(deps: UseModelSettingsControllerDeps): {
  state: ModelSettingsControllerState;
  actions: ModelSettingsControllerActions;
} {
  const { onRequestError } = deps;
  const notice = useWorkbenchToast();

  const providers = useWorkbenchShellStore(state => state.providers);
  const defaults = useWorkbenchShellStore(state => state.defaults);
  const providersLoading = useWorkbenchShellStore(state => state.providersLoading);
  const defaultsLoading = useWorkbenchShellStore(state => state.defaultsLoading);
  const setProviders = useWorkbenchShellStore(state => state.setProviders);
  const setDefaults = useWorkbenchShellStore(state => state.setDefaults);
  const setProvidersLoading = useWorkbenchShellStore(state => state.setProvidersLoading);
  const setDefaultsLoading = useWorkbenchShellStore(state => state.setDefaultsLoading);

  const { send: refreshProviders } = useRequest(() => modelSettingsMethods.queryProviders(), {
    immediate: false,
  });
  const { send: refreshDefaults } = useRequest(() => modelSettingsMethods.queryDefaults(), {
    immediate: false,
  });

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [defaultsDraft, setDefaultsDraft] = useState<{
    evaluateModelId: string;
    optimizeModelId: string;
  } | null>(null);
  const [providerDrafts, setProviderDrafts] = useState<Record<string, ProviderFormDraft>>({});

  const [providerSearch, setProviderSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [modelDisplayDrafts, setModelDisplayDrafts] = useState<Record<string, string>>({});

  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [addProviderName, setAddProviderName] = useState("");
  const [addProviderBaseUrl, setAddProviderBaseUrl] = useState("");
  const [addProviderApiKey, setAddProviderApiKey] = useState("");

  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addModelName, setAddModelName] = useState("");
  const [addModelDisplayName, setAddModelDisplayName] = useState("");

  const [validationErrors, setValidationErrors] = useState<ModelSettingsValidationErrors>({});
  const [togglingModelIds, setTogglingModelIds] = useState<Set<string>>(() => new Set());
  const [savingDisplayNameIds, setSavingDisplayNameIds] = useState<Set<string>>(() => new Set());

  const {
    loading: savingDefaults,
    send: sendSaveDefaults,
  } = useRequest((payload: {
    evaluateModelId: string | null;
    optimizeModelId: string | null;
  }) => modelSettingsMethods.saveDefaults(payload), {
    immediate: false,
  });

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

  const { send: sendSaveModel } = useRequest((payload: {
    modelId: string;
    data: {
      enabled?: boolean;
      displayName?: string | null;
    };
  }) => modelSettingsMethods.saveModel(payload), {
    immediate: false,
  });

  const refreshModelSettings = useCallback(async (silent = false) => {
    setProvidersLoading(true);
    setDefaultsLoading(true);

    try {
      const [providersResponse, defaultsResponse] = await Promise.all([
        refreshProviders(),
        refreshDefaults(),
      ]);

      const providersData = unwrapResponseData<{ providers: ProviderItem[] }>(providersResponse);
      const defaultsData = unwrapResponseData<ModelDefaultsData>(defaultsResponse);

      setProviders(providersData.providers);
      setDefaults(defaultsData);
      return true;
    } catch (error) {
      if (!silent) {
        onRequestError(error, {
          fallbackTitle: "加载模型设置失败",
        });
      }
      return false;
    } finally {
      setProvidersLoading(false);
      setDefaultsLoading(false);
    }
  }, [
    onRequestError,
    refreshDefaults,
    refreshProviders,
    setDefaults,
    setDefaultsLoading,
    setProviders,
    setProvidersLoading,
  ]);

  const sortedProviders = useMemo(() => {
    return [...providers].sort((left, right) => {
      if (left.enabled !== right.enabled) {
        return left.enabled ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "zh-CN");
    });
  }, [providers]);

  const activeProviderId = useMemo(() => {
    if (sortedProviders.length === 0) {
      return null;
    }

    if (selectedProviderId !== null && sortedProviders.some(provider => provider.id === selectedProviderId)) {
      return selectedProviderId;
    }

    return sortedProviders[0].id;
  }, [selectedProviderId, sortedProviders]);

  const filteredProviders = useMemo(() => {
    const keyword = providerSearch.trim().toLowerCase();
    if (!keyword) {
      return sortedProviders;
    }

    return sortedProviders.filter((provider) => {
      return provider.name.toLowerCase().includes(keyword)
        || provider.code.toLowerCase().includes(keyword)
        || provider.baseUrl.toLowerCase().includes(keyword);
    });
  }, [providerSearch, sortedProviders]);

  const selectedProvider = useMemo(() => {
    if (activeProviderId === null) {
      return null;
    }

    return providers.find(provider => provider.id === activeProviderId) ?? null;
  }, [activeProviderId, providers]);

  const selectedProviderDraft = useMemo(() => {
    if (selectedProvider === null) {
      return null;
    }

    return providerDrafts[selectedProvider.id] ?? createProviderDraft(selectedProvider);
  }, [providerDrafts, selectedProvider]);

  const sortedModels = useMemo(() => {
    if (!selectedProvider) {
      return [];
    }

    return [...selectedProvider.models].sort((left, right) => {
      if (left.enabled !== right.enabled) {
        return left.enabled ? -1 : 1;
      }
      return left.modelName.localeCompare(right.modelName, "zh-CN");
    });
  }, [selectedProvider]);

  const filteredModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) {
      return sortedModels;
    }

    return sortedModels.filter((model) => {
      const display = model.displayName ?? "";
      return model.modelName.toLowerCase().includes(keyword)
        || display.toLowerCase().includes(keyword);
    });
  }, [modelSearch, sortedModels]);

  const defaultModelOptions = useMemo(() => {
    return getEnabledModelOptions(providers);
  }, [providers]);

  const defaultEvaluateModelId = defaultsDraft?.evaluateModelId
    ?? defaults.evaluateModelId
    ?? MODEL_NONE_OPTION;
  const defaultOptimizeModelId = defaultsDraft?.optimizeModelId
    ?? defaults.optimizeModelId
    ?? MODEL_NONE_OPTION;

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

  const clearValidationError = useCallback((field: keyof ModelSettingsValidationErrors) => {
    setValidationErrors(previous => ({
      ...previous,
      [field]: false,
    }));
  }, []);

  const handleSaveDefaults = useCallback(async () => {
    try {
      await sendSaveDefaults({
        evaluateModelId: defaultEvaluateModelId === MODEL_NONE_OPTION ? null : defaultEvaluateModelId,
        optimizeModelId: defaultOptimizeModelId === MODEL_NONE_OPTION ? null : defaultOptimizeModelId,
      });

      setDefaultsDraft(null);
      await refreshModelSettings(true);

      notice.success({
        title: "默认模型已更新",
        message: "评估与优化默认模型保存成功。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "保存默认模型失败",
      });
    }
  }, [
    defaultEvaluateModelId,
    defaultOptimizeModelId,
    notice,
    onRequestError,
    refreshModelSettings,
    sendSaveDefaults,
  ]);

  const handleSaveProvider = useCallback(async () => {
    if (!selectedProvider || !selectedProviderDraft) {
      return;
    }

    const nextErrors: ModelSettingsValidationErrors = {};

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
      await refreshModelSettings(true);

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
          const mapped: ModelSettingsValidationErrors = {};
          if (hasField(fields, ["name"])) {
            mapped.providerName = true;
          }
          if (hasField(fields, ["baseUrl"])) {
            mapped.providerBaseUrl = true;
          }
          setValidationErrors(previous => ({ ...previous, ...mapped }));
        },
      });
    }
  }, [
    notice,
    onRequestError,
    refreshModelSettings,
    selectedProvider,
    selectedProviderDraft,
    sendSaveProviderSettings,
    updateSelectedProviderDraft,
  ]);

  const handleSyncModels = useCallback(async () => {
    if (!selectedProvider) {
      return;
    }

    try {
      await sendSyncProviderModels(selectedProvider.id);
      await refreshModelSettings(true);

      notice.success({
        title: "模型同步完成",
        message: "服务商模型列表已刷新。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "同步模型失败",
      });
    }
  }, [notice, onRequestError, refreshModelSettings, selectedProvider, sendSyncProviderModels]);

  const handleToggleModel = useCallback(async (model: ModelItem) => {
    setTogglingModelIds(previous => new Set(previous).add(model.id));

    try {
      await sendSaveModel({
        modelId: model.id,
        data: {
          enabled: !model.enabled,
        },
      });
      await refreshModelSettings(true);

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
  }, [notice, onRequestError, refreshModelSettings, sendSaveModel]);

  const handleSaveModelDisplayName = useCallback(async (model: ModelItem) => {
    setSavingDisplayNameIds(previous => new Set(previous).add(model.id));

    try {
      const nextDisplayName = (modelDisplayDrafts[model.id] ?? model.displayName ?? "").trim();

      await sendSaveModel({
        modelId: model.id,
        data: {
          displayName: nextDisplayName.length > 0 ? nextDisplayName : null,
        },
      });
      await refreshModelSettings(true);

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
  }, [modelDisplayDrafts, notice, onRequestError, refreshModelSettings, sendSaveModel]);

  const handleCreateProvider = useCallback(async () => {
    const nextErrors: ModelSettingsValidationErrors = {};

    if (!addProviderName.trim()) {
      nextErrors.addProviderName = true;
    }

    if (!addProviderBaseUrl.trim() || !isValidUrl(addProviderBaseUrl.trim())) {
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
        name: addProviderName,
        baseUrl: addProviderBaseUrl,
        apiKey: addProviderApiKey,
      });

      setAddProviderOpen(false);
      setAddProviderName("");
      setAddProviderBaseUrl("");
      setAddProviderApiKey("");

      await refreshModelSettings(true);

      notice.success({
        title: "服务商创建成功",
        message: "新服务商已加入列表。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "创建服务商失败",
        onValidationError: (fields) => {
          const mapped: ModelSettingsValidationErrors = {};
          if (hasField(fields, ["name"])) {
            mapped.addProviderName = true;
          }
          if (hasField(fields, ["baseUrl"])) {
            mapped.addProviderBaseUrl = true;
          }
          setValidationErrors(previous => ({ ...previous, ...mapped }));
        },
      });
    }
  }, [
    addProviderApiKey,
    addProviderBaseUrl,
    addProviderName,
    notice,
    onRequestError,
    refreshModelSettings,
    sendCreateProvider,
  ]);

  const handleCreateModel = useCallback(async () => {
    if (!selectedProvider) {
      return;
    }

    const nextErrors: ModelSettingsValidationErrors = {};

    if (!addModelName.trim()) {
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
        modelName: addModelName,
        displayName: addModelDisplayName.trim() || undefined,
      });

      setAddModelOpen(false);
      setAddModelName("");
      setAddModelDisplayName("");

      await refreshModelSettings(true);

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
  }, [
    addModelDisplayName,
    addModelName,
    notice,
    onRequestError,
    refreshModelSettings,
    selectedProvider,
    sendCreateModel,
  ]);

  return {
    state: {
      providers,
      defaults,
      settingsLoading: providersLoading || defaultsLoading,
      defaultModelOptions,
      defaultEvaluateModelId,
      defaultOptimizeModelId,
      providerSearch,
      modelSearch,
      filteredProviders,
      activeProviderId,
      selectedProvider,
      selectedProviderDraft,
      filteredModels,
      modelDisplayDrafts,
      addProviderOpen,
      addProviderName,
      addProviderBaseUrl,
      addProviderApiKey,
      addModelOpen,
      addModelName,
      addModelDisplayName,
      validationErrors,
      togglingModelIds,
      savingDisplayNameIds,
      savingDefaults,
      savingProvider,
      syncingModels,
      addingProvider,
      addingModel,
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
      saveDefaults: handleSaveDefaults,
      setProviderSearch,
      setModelSearch,
      selectProvider: setSelectedProviderId,
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
      saveProvider: handleSaveProvider,
      syncModels: handleSyncModels,
      openAddProvider: setAddProviderOpen,
      setAddProviderName: (value) => {
        setAddProviderName(value);
        clearValidationError("addProviderName");
      },
      setAddProviderBaseUrl: (value) => {
        setAddProviderBaseUrl(value);
        clearValidationError("addProviderBaseUrl");
      },
      setAddProviderApiKey,
      createProvider: handleCreateProvider,
      openAddModel: setAddModelOpen,
      setAddModelName: (value) => {
        setAddModelName(value);
        clearValidationError("addModelName");
      },
      setAddModelDisplayName,
      createModel: handleCreateModel,
      toggleModel: handleToggleModel,
      setModelDisplayDraft: (modelId, value) => {
        setModelDisplayDrafts(previous => ({
          ...previous,
          [modelId]: value,
        }));
      },
      saveModelDisplayName: handleSaveModelDisplayName,
    },
  };
}
