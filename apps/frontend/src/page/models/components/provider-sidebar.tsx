import type { ProviderItem } from "@/lib/workbench-api";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProviderSidebarProps {
  providers: ProviderItem[];
  activeProviderId: string | null;
  providerSearch: string;
  onProviderSearchChange: (value: string) => void;
  onSelectProvider: (providerId: string) => void;
  onOpenAddProvider: () => void;
}

export function ProviderSidebar(props: ProviderSidebarProps) {
  const {
    providers,
    activeProviderId,
    providerSearch,
    onProviderSearchChange,
    onSelectProvider,
    onOpenAddProvider,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">服务商</CardTitle>
          <Button size="sm" variant="outline" onClick={onOpenAddProvider}>
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>
        <Input
          value={providerSearch}
          onChange={event => onProviderSearchChange(event.target.value)}
          placeholder="搜索服务商"
        />
      </CardHeader>
      <CardContent className="grid gap-2">
        {providers.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
            未找到服务商。
          </div>
        )}
        {providers.map((provider) => {
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
              onClick={() => onSelectProvider(provider.id)}
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
  );
}
