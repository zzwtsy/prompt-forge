import type {
  ModelSettingsValidationErrors,
  ProviderFormDraft,
} from "../types";
import type { ProviderItem } from "@/lib/workbench-api";
import { Loader2, Plus, RefreshCw } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ProviderModelsSection } from "./provider-models-section";

interface ProviderSettingsCardProps {
  selectedProvider: ProviderItem | null;
  selectedProviderDraft: ProviderFormDraft | null;
  models: ProviderItem["models"];
  validationErrors: ModelSettingsValidationErrors;
  modelSearch: string;
  modelDisplayDrafts: Record<string, string>;
  togglingModelIds: Set<string>;
  savingDisplayNameIds: Set<string>;
  savingProvider: boolean;
  syncingModels: boolean;
  settingsLoading: boolean;
  onSelectedProviderNameChange: (value: string) => void;
  onSelectedProviderBaseUrlChange: (value: string) => void;
  onSelectedProviderApiKeyChange: (value: string) => void;
  onToggleSelectedProviderEnabled: () => void;
  onToggleSelectedProviderClearApiKey: () => void;
  onSaveProvider: () => Promise<void>;
  onSyncModels: () => Promise<void>;
  onOpenAddModel: () => void;
  onModelSearchChange: (value: string) => void;
  onToggleModel: (model: ProviderItem["models"][number]) => Promise<void>;
  onModelDisplayNameChange: (modelId: string, value: string) => void;
  onSaveModelDisplayName: (model: ProviderItem["models"][number]) => Promise<void>;
}

export function ProviderSettingsCard(props: ProviderSettingsCardProps) {
  const {
    selectedProvider,
    selectedProviderDraft,
    models,
    validationErrors,
    modelSearch,
    modelDisplayDrafts,
    togglingModelIds,
    savingDisplayNameIds,
    savingProvider,
    syncingModels,
    settingsLoading,
    onSelectedProviderNameChange,
    onSelectedProviderBaseUrlChange,
    onSelectedProviderApiKeyChange,
    onToggleSelectedProviderEnabled,
    onToggleSelectedProviderClearApiKey,
    onSaveProvider,
    onSyncModels,
    onOpenAddModel,
    onModelSearchChange,
    onToggleModel,
    onModelDisplayNameChange,
    onSaveModelDisplayName,
  } = props;

  return (
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
                onClick={onToggleSelectedProviderEnabled}
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
                    onSelectedProviderNameChange(event.target.value);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>BaseURL</Label>
                <Input
                  value={selectedProviderDraft.baseUrl}
                  aria-invalid={validationErrors.providerBaseUrl ? "true" : "false"}
                  onChange={(event) => {
                    onSelectedProviderBaseUrlChange(event.target.value);
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
                  onSelectedProviderApiKeyChange(event.target.value);
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
                  onClick={onToggleSelectedProviderClearApiKey}
                >
                  {selectedProviderDraft.clearApiKey ? "将清空 Key" : "清空 Key"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={savingProvider || settingsLoading}
                onClick={() => {
                  void onSaveProvider();
                }}
              >
                {savingProvider && <Loader2 className="mr-1 size-4 animate-spin" />}
                保存服务商设置
              </Button>
              <Button
                variant="outline"
                disabled={syncingModels || settingsLoading}
                onClick={() => {
                  void onSyncModels();
                }}
              >
                {syncingModels ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RefreshCw className="mr-1 size-4" />}
                获取模型列表
              </Button>
              <Button variant="outline" onClick={onOpenAddModel}>
                <Plus className="mr-1 size-4" />
                手动添加模型
              </Button>
            </div>

            <Separator />

            <ProviderModelsSection
              modelSearch={modelSearch}
              models={models}
              modelDisplayDrafts={modelDisplayDrafts}
              togglingModelIds={togglingModelIds}
              savingDisplayNameIds={savingDisplayNameIds}
              onModelSearchChange={onModelSearchChange}
              onToggleModel={onToggleModel}
              onModelDisplayNameChange={onModelDisplayNameChange}
              onSaveModelDisplayName={onSaveModelDisplayName}
            />
          </CardContent>
        </>
      )}
    </Card>
  );
}
