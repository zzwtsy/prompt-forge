import type { ModelOption } from "@/lib/workbench-api";
import type { OptimizeFieldErrors } from "@/store";
import { Loader2, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { MODEL_DEFAULT_OPTION } from "@/lib/workbench-shell";

interface OptimizeFormCardProps {
  prompt: string;
  evaluateModelId: string;
  optimizeModelId: string;
  evaluateTemperature: string;
  optimizeTemperature: string;
  fieldErrors: OptimizeFieldErrors;
  modelOptions: ModelOption[];
  settingsLoading: boolean;
  isEvaluateDisabled: boolean;
  isOptimizeDisabled: boolean;
  evaluatePending: boolean;
  optimizePending: boolean;
  onPromptChange: (value: string) => void;
  onEvaluateModelChange: (value: string) => void;
  onOptimizeModelChange: (value: string) => void;
  onEvaluateTemperatureChange: (value: string) => void;
  onOptimizeTemperatureChange: (value: string) => void;
  onEvaluate: () => Promise<void>;
  onOptimize: () => Promise<void>;
}

export function OptimizeFormCard(props: OptimizeFormCardProps) {
  const {
    prompt,
    evaluateModelId,
    optimizeModelId,
    evaluateTemperature,
    optimizeTemperature,
    fieldErrors,
    modelOptions,
    settingsLoading,
    isEvaluateDisabled,
    isOptimizeDisabled,
    evaluatePending,
    optimizePending,
    onPromptChange,
    onEvaluateModelChange,
    onOptimizeModelChange,
    onEvaluateTemperatureChange,
    onOptimizeTemperatureChange,
    onEvaluate,
    onOptimize,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="size-4 text-slate-700" />
          提示词优化
        </CardTitle>
        <CardDescription>输入原始提示词，先评估再优化。切换 Tab 后当前输入会保留。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="source-prompt">原始提示词</Label>
            <Textarea
              id="source-prompt"
              value={prompt}
              onChange={(event) => {
                onPromptChange(event.target.value);
              }}
              aria-invalid={fieldErrors.prompt ? "true" : "false"}
              className="min-h-36 bg-white/80"
              placeholder="请输入需要评估与优化的提示词..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card size="sm" className="border-slate-200/80 bg-slate-50/80">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">评估模型</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label>模型</Label>
                  <Select value={evaluateModelId} onValueChange={onEvaluateModelChange}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MODEL_DEFAULT_OPTION}>使用默认模型</SelectItem>
                      {modelOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Temperature</Label>
                  <Input
                    value={evaluateTemperature}
                    onChange={(event) => {
                      onEvaluateTemperatureChange(event.target.value);
                    }}
                    aria-invalid={fieldErrors.evaluateTemperature ? "true" : "false"}
                    inputMode="decimal"
                    placeholder="0 ~ 2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="border-slate-200/80 bg-slate-50/80">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">优化模型</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label>模型</Label>
                  <Select value={optimizeModelId} onValueChange={onOptimizeModelChange}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MODEL_DEFAULT_OPTION}>使用默认模型</SelectItem>
                      {modelOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Temperature</Label>
                  <Input
                    value={optimizeTemperature}
                    onChange={(event) => {
                      onOptimizeTemperatureChange(event.target.value);
                    }}
                    aria-invalid={fieldErrors.optimizeTemperature ? "true" : "false"}
                    inputMode="decimal"
                    placeholder="0 ~ 2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button
            disabled={isEvaluateDisabled || settingsLoading}
            onClick={() => {
              void onEvaluate();
            }}
          >
            {evaluatePending && <Loader2 className="mr-1 size-4 animate-spin" />}
            评估
          </Button>
          <Button
            disabled={isOptimizeDisabled || settingsLoading}
            onClick={() => {
              void onOptimize();
            }}
          >
            {optimizePending && <Loader2 className="mr-1 size-4 animate-spin" />}
            优化
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>可选模型：</span>
          <Badge variant="outline">{modelOptions.length}</Badge>
          {settingsLoading && <span>正在同步模型配置...</span>}
        </div>
      </CardFooter>
    </Card>
  );
}
