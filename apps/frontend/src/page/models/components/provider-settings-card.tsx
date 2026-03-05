import type {
  ProviderModelsSection as ProviderModelsSectionVM,
  ProviderSettingsSection as ProviderSettingsSectionVM,
} from "../types";
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
  settingsSection: ProviderSettingsSectionVM;
  modelsSection: ProviderModelsSectionVM;
  onOpenAddModel: () => void;
}

export function ProviderSettingsCard(props: ProviderSettingsCardProps) {
  const { settingsSection, modelsSection, onOpenAddModel } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      {!settingsSection.state.selectedProvider && (
        <CardContent className="py-10 text-center text-sm text-slate-500">暂无服务商配置。</CardContent>
      )}

      {settingsSection.state.selectedProvider && settingsSection.state.selectedProviderDraft && (
        <>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">{settingsSection.state.selectedProvider.name}</CardTitle>
                <CardDescription>{settingsSection.state.selectedProvider.kind === "openai" ? "OpenAI 官方服务商" : "OpenAI-Compatible 服务商"}</CardDescription>
              </div>
              <Button
                size="sm"
                variant={settingsSection.state.selectedProviderDraft.enabled ? "default" : "outline"}
                onClick={settingsSection.actions.toggleSelectedProviderEnabled}
              >
                {settingsSection.state.selectedProviderDraft.enabled ? "已启用" : "已停用"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>服务商名称</Label>
                <Input
                  value={settingsSection.state.selectedProviderDraft.name}
                  aria-invalid={settingsSection.state.validationErrors.providerName ? "true" : "false"}
                  onChange={(event) => {
                    settingsSection.actions.setSelectedProviderName(event.target.value);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>BaseURL</Label>
                <Input
                  value={settingsSection.state.selectedProviderDraft.baseUrl}
                  aria-invalid={settingsSection.state.validationErrors.providerBaseUrl ? "true" : "false"}
                  onChange={(event) => {
                    settingsSection.actions.setSelectedProviderBaseUrl(event.target.value);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settingsSection.state.selectedProviderDraft.apiKey}
                onChange={(event) => {
                  settingsSection.actions.setSelectedProviderApiKey(event.target.value);
                }}
                placeholder="留空表示不变"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline">{settingsSection.state.selectedProvider.hasApiKey ? "已配置" : "未配置"}</Badge>
                {settingsSection.state.selectedProvider.apiKeyMasked !== null && settingsSection.state.selectedProvider.apiKeyMasked !== "" && (
                  <span>
                    当前：
                    {settingsSection.state.selectedProvider.apiKeyMasked}
                  </span>
                )}
                <Button
                  variant={settingsSection.state.selectedProviderDraft.clearApiKey ? "default" : "outline"}
                  size="xs"
                  onClick={settingsSection.actions.toggleSelectedProviderClearApiKey}
                >
                  {settingsSection.state.selectedProviderDraft.clearApiKey ? "将清空 Key" : "清空 Key"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={settingsSection.state.savingProvider || settingsSection.state.settingsLoading}
                onClick={() => {
                  void settingsSection.actions.saveProvider();
                }}
              >
                {settingsSection.state.savingProvider && <Loader2 className="mr-1 size-4 animate-spin" />}
                保存服务商设置
              </Button>
              <Button
                variant="outline"
                disabled={settingsSection.state.syncingModels || settingsSection.state.settingsLoading}
                onClick={() => {
                  void settingsSection.actions.syncModels();
                }}
              >
                {settingsSection.state.syncingModels ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RefreshCw className="mr-1 size-4" />}
                获取模型列表
              </Button>
              <Button variant="outline" onClick={onOpenAddModel}>
                <Plus className="mr-1 size-4" />
                手动添加模型
              </Button>
            </div>

            <Separator />

            <ProviderModelsSection section={modelsSection} />
          </CardContent>
        </>
      )}
    </Card>
  );
}
