import type { ProviderModelsSection as ProviderModelsSectionVM } from "../types";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProviderModelsSectionProps {
  section: ProviderModelsSectionVM;
}

export function ProviderModelsSection(props: ProviderModelsSectionProps) {
  const { section } = props;

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-slate-700">模型管理</p>
        <Input
          value={section.state.modelSearch}
          onChange={event => section.actions.setModelSearch(event.target.value)}
          placeholder="搜索模型"
          className="md:max-w-xs"
        />
      </div>

      {section.state.filteredModels.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          当前服务商暂无模型。
        </div>
      )}

      <div className="grid gap-2">
        {section.state.filteredModels.map((model) => {
          const isToggling = section.state.togglingModelIds.has(model.id);
          const isSavingDisplayName = section.state.savingDisplayNameIds.has(model.id);

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
                    void section.actions.toggleModel(model);
                  }}
                >
                  {isToggling && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  {model.enabled ? "已启用" : "已停用"}
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input
                  value={section.state.modelDisplayDrafts[model.id] ?? model.displayName ?? ""}
                  onChange={(event) => {
                    section.actions.setModelDisplayDraft(model.id, event.target.value);
                  }}
                  placeholder="显示名（可选）"
                />
                <Button
                  variant="outline"
                  disabled={isSavingDisplayName}
                  onClick={() => {
                    void section.actions.saveModelDisplayName(model);
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
