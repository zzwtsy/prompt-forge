import type {
  ModelDefaultsData,
  ModelItem,
  ProviderItem,
} from "@/lib/workbench-api";
import type {
  RequestErrorOptions,
} from "@/lib/workbench-shell";
import { useRequest } from "alova/client";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { modelSettingsMethods } from "@/lib/workbench-api";
import { MODEL_NONE_OPTION, useWorkbenchToast } from "@/lib/workbench-shell";
import {
  getEnabledModelOptions,
  hasField,
  isValidUrl,
} from "../utils";

interface ModelSettingsTabProps {
  providers: ProviderItem[];
  defaults: ModelDefaultsData;
  settingsLoading: boolean;
  refreshSettings: (silent?: boolean) => Promise<boolean>;
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
}

interface ModelSettingsValidationErrors {
  providerName?: boolean;
  providerBaseUrl?: boolean;
  addProviderName?: boolean;
  addProviderBaseUrl?: boolean;
  addModelName?: boolean;
}

interface ProviderFormDraft {
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  clearApiKey: boolean;
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

export function ModelSettingsTab(props: ModelSettingsTabProps) {
  const {
    providers,
    defaults,
    settingsLoading,
    refreshSettings,
    onRequestError,
  } = props;
  const notice = useWorkbenchToast();

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

  const clearValidationError = (field: keyof ModelSettingsValidationErrors) => {
    setValidationErrors(previous => ({
      ...previous,
      [field]: false,
    }));
  };

  const handleSaveDefaults = async () => {
    try {
      await sendSaveDefaults({
        evaluateModelId: defaultEvaluateModelId === MODEL_NONE_OPTION ? null : defaultEvaluateModelId,
        optimizeModelId: defaultOptimizeModelId === MODEL_NONE_OPTION ? null : defaultOptimizeModelId,
      });

      setDefaultsDraft(null);
      await refreshSettings(true);

      notice.success({
        title: "默认模型已更新",
        message: "评估与优化默认模型保存成功。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "保存默认模型失败",
      });
    }
  };

  const handleSaveProvider = async () => {
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
      await refreshSettings(true);

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
  };

  const handleSyncModels = async () => {
    if (!selectedProvider) {
      return;
    }

    try {
      await sendSyncProviderModels(selectedProvider.id);
      await refreshSettings(true);

      notice.success({
        title: "模型同步完成",
        message: "服务商模型列表已刷新。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "同步模型失败",
      });
    }
  };

  const handleToggleModel = async (model: ModelItem) => {
    setTogglingModelIds(previous => new Set(previous).add(model.id));

    try {
      await sendSaveModel({
        modelId: model.id,
        data: {
          enabled: !model.enabled,
        },
      });
      await refreshSettings(true);

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
  };

  const handleSaveModelDisplayName = async (model: ModelItem) => {
    setSavingDisplayNameIds(previous => new Set(previous).add(model.id));

    try {
      const nextDisplayName = (modelDisplayDrafts[model.id] ?? model.displayName ?? "").trim();

      await sendSaveModel({
        modelId: model.id,
        data: {
          displayName: nextDisplayName.length > 0 ? nextDisplayName : null,
        },
      });
      await refreshSettings(true);

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
  };

  const handleCreateProvider = async () => {
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

      await refreshSettings(true);

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
  };

  const handleCreateModel = async () => {
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

      await refreshSettings(true);

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
  };

  return (
    <div className="grid gap-4">
      <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
        <CardHeader className="flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>默认模型设置</CardTitle>
            <CardDescription>设置“评估”与“优化”未显式指定模型时的默认执行模型。</CardDescription>
          </div>
          <Button disabled={savingDefaults || settingsLoading} onClick={handleSaveDefaults}>
            {savingDefaults && <Loader2 className="mr-1 size-4 animate-spin" />}
            保存默认模型
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>默认评估模型</Label>
            <Select
              value={defaultEvaluateModelId}
              onValueChange={value => setDefaultsDraft(previous => ({
                evaluateModelId: value,
                optimizeModelId: previous?.optimizeModelId ?? defaultOptimizeModelId,
              }))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MODEL_NONE_OPTION}>不设置默认模型</SelectItem>
                {defaultModelOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>默认优化模型</Label>
            <Select
              value={defaultOptimizeModelId}
              onValueChange={value => setDefaultsDraft(previous => ({
                evaluateModelId: previous?.evaluateModelId ?? defaultEvaluateModelId,
                optimizeModelId: value,
              }))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MODEL_NONE_OPTION}>不设置默认模型</SelectItem>
                {defaultModelOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">服务商</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddProviderOpen(true)}>
                <Plus className="size-3.5" />
                添加
              </Button>
            </div>
            <Input
              value={providerSearch}
              onChange={event => setProviderSearch(event.target.value)}
              placeholder="搜索服务商"
            />
          </CardHeader>
          <CardContent className="grid gap-2">
            {filteredProviders.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                未找到服务商。
              </div>
            )}
            {filteredProviders.map((provider) => {
              const isActive = provider.id === activeProviderId;
              const providerStatusClass = isActive
                ? "border-white/20 bg-white/10 text-slate-100"
                : provider.enabled
                  ? "border-slate-300 bg-slate-50 text-slate-600"
                  : "border-slate-200 bg-white text-slate-400";

              return (
                <Button
                  key={provider.id}
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={cn(
                    "h-auto w-full flex-col items-stretch justify-start gap-1 rounded-lg px-3 py-2 text-left transition-[background-color,border-color,color,box-shadow] duration-200",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("min-w-0 flex-1 truncate text-sm font-medium", isActive ? "text-white" : "text-slate-800")}>
                      {provider.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(providerStatusClass)}
                    >
                      {provider.enabled ? "启用" : "停用"}
                    </Badge>
                  </div>
                  <p className={cn("truncate text-xs", isActive ? "text-slate-200" : "text-slate-500")}>{provider.code}</p>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
          {!selectedProvider && (
            <CardContent className="py-10 text-center text-sm text-slate-500">暂无服务商配置。</CardContent>
          )}

          {selectedProvider && selectedProviderDraft && (
            <>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedProvider.name}</CardTitle>
                    <CardDescription>{selectedProvider.kind === "openai" ? "OpenAI 官方服务商" : "OpenAI-Compatible 服务商"}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedProviderDraft.enabled ? "default" : "outline"}
                    onClick={() => updateSelectedProviderDraft(previous => ({
                      ...previous,
                      enabled: !previous.enabled,
                    }))}
                  >
                    {selectedProviderDraft.enabled ? "已启用" : "已停用"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>服务商名称</Label>
                    <Input
                      value={selectedProviderDraft.name}
                      aria-invalid={validationErrors.providerName ? "true" : "false"}
                      onChange={(event) => {
                        updateSelectedProviderDraft(previous => ({
                          ...previous,
                          name: event.target.value,
                        }));
                        clearValidationError("providerName");
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>BaseURL</Label>
                    <Input
                      value={selectedProviderDraft.baseUrl}
                      aria-invalid={validationErrors.providerBaseUrl ? "true" : "false"}
                      onChange={(event) => {
                        updateSelectedProviderDraft(previous => ({
                          ...previous,
                          baseUrl: event.target.value,
                        }));
                        clearValidationError("providerBaseUrl");
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={selectedProviderDraft.apiKey}
                    onChange={(event) => {
                      updateSelectedProviderDraft(previous => ({
                        ...previous,
                        apiKey: event.target.value,
                        clearApiKey: false,
                      }));
                    }}
                    placeholder="留空表示不变"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline">{selectedProvider.hasApiKey ? "已配置" : "未配置"}</Badge>
                    {selectedProvider.apiKeyMasked !== null && selectedProvider.apiKeyMasked !== "" && (
                      <span>
                        当前：
                        {selectedProvider.apiKeyMasked}
                      </span>
                    )}
                    <Button
                      variant={selectedProviderDraft.clearApiKey ? "default" : "outline"}
                      size="xs"
                      onClick={() => updateSelectedProviderDraft(previous => ({
                        ...previous,
                        clearApiKey: !previous.clearApiKey,
                      }))}
                    >
                      {selectedProviderDraft.clearApiKey ? "将清空 Key" : "清空 Key"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button disabled={savingProvider || settingsLoading} onClick={handleSaveProvider}>
                    {savingProvider && <Loader2 className="mr-1 size-4 animate-spin" />}
                    保存服务商设置
                  </Button>
                  <Button variant="outline" disabled={syncingModels || settingsLoading} onClick={handleSyncModels}>
                    {syncingModels ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RefreshCw className="mr-1 size-4" />}
                    获取模型列表
                  </Button>
                  <Button variant="outline" onClick={() => setAddModelOpen(true)}>
                    <Plus className="mr-1 size-4" />
                    手动添加模型
                  </Button>
                </div>

                <Separator />

                <div className="grid gap-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-medium text-slate-700">模型管理</p>
                    <Input
                      value={modelSearch}
                      onChange={event => setModelSearch(event.target.value)}
                      placeholder="搜索模型"
                      className="md:max-w-xs"
                    />
                  </div>

                  {filteredModels.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                      当前服务商暂无模型。
                    </div>
                  )}

                  <div className="grid gap-2">
                    {filteredModels.map((model) => {
                      const isToggling = togglingModelIds.has(model.id);
                      const isSavingDisplayName = savingDisplayNameIds.has(model.id);

                      return (
                        <div key={model.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-medium text-slate-800">{model.modelName}</p>
                              <Badge variant={model.source === "manual" ? "outline" : "secondary"}>
                                {model.source === "manual" ? "手动" : "同步"}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant={model.enabled ? "default" : "outline"}
                              disabled={isToggling}
                              onClick={() => handleToggleModel(model)}
                            >
                              {isToggling && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                              {model.enabled ? "已启用" : "已停用"}
                            </Button>
                          </div>

                          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                            <Input
                              value={modelDisplayDrafts[model.id] ?? model.displayName ?? ""}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setModelDisplayDrafts(previous => ({
                                  ...previous,
                                  [model.id]: nextValue,
                                }));
                              }}
                              placeholder="显示名（可选）"
                            />
                            <Button
                              variant="outline"
                              disabled={isSavingDisplayName}
                              onClick={() => handleSaveModelDisplayName(model)}
                            >
                              {isSavingDisplayName && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                              保存显示名
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <AlertDialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>添加自定义服务商</AlertDialogTitle>
            <AlertDialogDescription>创建新的 OpenAI-Compatible 服务商配置。</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>服务商名称</Label>
              <Input
                value={addProviderName}
                aria-invalid={validationErrors.addProviderName ? "true" : "false"}
                onChange={(event) => {
                  setAddProviderName(event.target.value);
                  clearValidationError("addProviderName");
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>BaseURL</Label>
              <Input
                value={addProviderBaseUrl}
                aria-invalid={validationErrors.addProviderBaseUrl ? "true" : "false"}
                onChange={(event) => {
                  setAddProviderBaseUrl(event.target.value);
                  clearValidationError("addProviderBaseUrl");
                }}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>API Key（可选）</Label>
              <Input
                type="password"
                value={addProviderApiKey}
                onChange={event => setAddProviderApiKey(event.target.value)}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={addingProvider}>取消</AlertDialogCancel>
            <Button disabled={addingProvider} onClick={handleCreateProvider}>
              {addingProvider && <Loader2 className="mr-1 size-4 animate-spin" />}
              创建服务商
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={addModelOpen} onOpenChange={setAddModelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>手动添加模型</AlertDialogTitle>
            <AlertDialogDescription>向当前服务商追加一个模型标识。</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>模型名称</Label>
              <Input
                value={addModelName}
                aria-invalid={validationErrors.addModelName ? "true" : "false"}
                onChange={(event) => {
                  setAddModelName(event.target.value);
                  clearValidationError("addModelName");
                }}
                placeholder="例如: gpt-4.1-mini"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>显示名（可选）</Label>
              <Input
                value={addModelDisplayName}
                onChange={event => setAddModelDisplayName(event.target.value)}
                placeholder="例如: GPT-4.1 Mini"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={addingModel}>取消</AlertDialogCancel>
            <Button disabled={addingModel || !selectedProvider} onClick={handleCreateModel}>
              {addingModel && <Loader2 className="mr-1 size-4 animate-spin" />}
              创建模型
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
