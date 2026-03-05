import type { ModelItem } from "@/lib/workbench-api";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProviderModelsSectionProps {
  modelSearch: string;
  models: ModelItem[];
  modelDisplayDrafts: Record<string, string>;
  togglingModelIds: Set<string>;
  savingDisplayNameIds: Set<string>;
  onModelSearchChange: (value: string) => void;
  onToggleModel: (model: ModelItem) => Promise<void>;
  onModelDisplayNameChange: (modelId: string, value: string) => void;
  onSaveModelDisplayName: (model: ModelItem) => Promise<void>;
}

export function ProviderModelsSection(props: ProviderModelsSectionProps) {
  const {
    modelSearch,
    models,
    modelDisplayDrafts,
    togglingModelIds,
    savingDisplayNameIds,
    onModelSearchChange,
    onToggleModel,
    onModelDisplayNameChange,
    onSaveModelDisplayName,
  } = props;

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-slate-700">模型管理</p>
        <Input
          value={modelSearch}
          onChange={event => onModelSearchChange(event.target.value)}
          placeholder="搜索模型"
          className="md:max-w-xs"
        />
      </div>

      {models.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          当前服务商暂无模型。
        </div>
      )}

      <div className="grid gap-2">
        {models.map((model) => {
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
                  onClick={() => {
                    void onToggleModel(model);
                  }}
                >
                  {isToggling && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  {model.enabled ? "已启用" : "已停用"}
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input
                  value={modelDisplayDrafts[model.id] ?? model.displayName ?? ""}
                  onChange={(event) => {
                    onModelDisplayNameChange(model.id, event.target.value);
                  }}
                  placeholder="显示名（可选）"
                />
                <Button
                  variant="outline"
                  disabled={isSavingDisplayName}
                  onClick={() => {
                    void onSaveModelDisplayName(model);
                  }}
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
  );
}
