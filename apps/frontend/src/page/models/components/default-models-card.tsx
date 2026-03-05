import type { DefaultModelsSection } from "../types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_NONE_OPTION } from "@/lib/workbench-shell";

interface DefaultModelsCardProps {
  section: DefaultModelsSection;
}

export function DefaultModelsCard(props: DefaultModelsCardProps) {
  const { section } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>默认模型设置</CardTitle>
          <CardDescription>设置“评估”与“优化”未显式指定模型时的默认执行模型。</CardDescription>
        </div>
        <Button
          disabled={section.state.savingDefaults || section.state.settingsLoading}
          onClick={() => {
            void section.actions.saveDefaults();
          }}
        >
          {section.state.savingDefaults && <Loader2 className="mr-1 size-4 animate-spin" />}
          保存默认模型
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>默认评估模型</Label>
          <Select
            value={section.state.defaultEvaluateModelId}
            onValueChange={section.actions.setDefaultEvaluateModelId}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MODEL_NONE_OPTION}>不设置默认模型</SelectItem>
              {section.state.defaultModelOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>默认优化模型</Label>
          <Select
            value={section.state.defaultOptimizeModelId}
            onValueChange={section.actions.setDefaultOptimizeModelId}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MODEL_NONE_OPTION}>不设置默认模型</SelectItem>
              {section.state.defaultModelOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
