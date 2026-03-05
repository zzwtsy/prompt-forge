import type {
  EvaluateResponseData,
  OptimizeResponseData,
  ProviderItem,
  SignedSaveDraft,
} from "@/lib/workbench-api";
import type {
  RequestErrorOptions,
} from "@/lib/workbench-shell";
import type { OptimizeFieldErrors } from "@/store";
import { useRequest } from "alova/client";
import { Copy, Loader2, Save, WandSparkles } from "lucide-react";
import { useMemo } from "react";
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
import {
  promptRuntimeMethods,
  savedPromptsMethods,
} from "@/lib/workbench-api";
import { MODEL_DEFAULT_OPTION, useWorkbenchToast } from "@/lib/workbench-shell";
import { useOptimizeSessionStore } from "@/store";
import {
  getEnabledModelOptions,
  hasField,
  parseOptionalFloat,
  writeClipboardText,
} from "../utils";

interface OptimizeTabProps {
  providers: ProviderItem[];
  settingsLoading: boolean;
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
  onPersistedHistory: () => void;
}

function unwrapResponseData<T>(response: T | { data: T }): T {
  return (typeof response === "object" && response !== null && "data" in response)
    ? response.data as T
    : response;
}

export function OptimizeTab(props: OptimizeTabProps) {
  const {
    providers,
    settingsLoading,
    onRequestError,
    onPersistedHistory,
  } = props;
  const notice = useWorkbenchToast();

  const prompt = useOptimizeSessionStore(state => state.prompt);
  const setPrompt = useOptimizeSessionStore(state => state.setPrompt);
  const evaluateModelId = useOptimizeSessionStore(state => state.evaluateModelId);
  const setEvaluateModelId = useOptimizeSessionStore(state => state.setEvaluateModelId);
  const optimizeModelId = useOptimizeSessionStore(state => state.optimizeModelId);
  const setOptimizeModelId = useOptimizeSessionStore(state => state.setOptimizeModelId);
  const evaluateTemperature = useOptimizeSessionStore(state => state.evaluateTemperature);
  const setEvaluateTemperature = useOptimizeSessionStore(state => state.setEvaluateTemperature);
  const optimizeTemperature = useOptimizeSessionStore(state => state.optimizeTemperature);
  const setOptimizeTemperature = useOptimizeSessionStore(state => state.setOptimizeTemperature);
  const evaluationResult = useOptimizeSessionStore(state => state.evaluationResult);
  const setEvaluationResult = useOptimizeSessionStore(state => state.setEvaluationResult);
  const optimizedPrompt = useOptimizeSessionStore(state => state.optimizedPrompt);
  const setOptimizedPrompt = useOptimizeSessionStore(state => state.setOptimizedPrompt);
  const evaluateResolvedModel = useOptimizeSessionStore(state => state.evaluateResolvedModel);
  const setEvaluateResolvedModel = useOptimizeSessionStore(state => state.setEvaluateResolvedModel);
  const optimizeResolvedModel = useOptimizeSessionStore(state => state.optimizeResolvedModel);
  const setOptimizeResolvedModel = useOptimizeSessionStore(state => state.setOptimizeResolvedModel);
  const evaluateContext = useOptimizeSessionStore(state => state.evaluateContext);
  const setEvaluateContext = useOptimizeSessionStore(state => state.setEvaluateContext);
  const saveDraft = useOptimizeSessionStore(state => state.saveDraft);
  const setSaveDraft = useOptimizeSessionStore(state => state.setSaveDraft);
  const fieldErrors = useOptimizeSessionStore(state => state.fieldErrors);
  const setFieldErrors = useOptimizeSessionStore(state => state.setFieldErrors);

  const {
    loading: evaluatePending,
    send: sendEvaluate,
  } = useRequest((payload: {
    prompt: string;
    modelId?: string;
    temperature?: number;
  }) => promptRuntimeMethods.evaluate(payload), {
    immediate: false,
  });

  const {
    loading: optimizePending,
    send: sendOptimize,
  } = useRequest((payload: {
    prompt: string;
    evaluationResult?: string;
    modelId?: string;
    temperature?: number;
    evaluateContext?: {
      modelId: string;
      temperature?: number;
    };
  }) => promptRuntimeMethods.optimize(payload), {
    immediate: false,
  });

  const {
    loading: retryPending,
    send: sendRetrySave,
  } = useRequest((draft: SignedSaveDraft) => savedPromptsMethods.retrySavePrompt(draft), {
    immediate: false,
  });

  const modelOptions = useMemo(() => {
    return getEnabledModelOptions(providers);
  }, [providers]);

  const isEvaluateDisabled = prompt.trim().length === 0 || evaluatePending || optimizePending;
  const isOptimizeDisabled = evaluationResult.trim().length === 0 || optimizePending || evaluatePending;

  const clearFieldError = (field: keyof OptimizeFieldErrors) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: false,
    }));
  };

  const handleEvaluate = async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedEvaluateTemperature = parseOptionalFloat(evaluateTemperature);
    const invalidEvaluateTemperature = parsedEvaluateTemperature === "invalid"
      || (typeof parsedEvaluateTemperature === "number"
        && (parsedEvaluateTemperature < 0 || parsedEvaluateTemperature > 2));
    if (invalidEvaluateTemperature) {
      nextErrors.evaluateTemperature = true;
    }

    setFieldErrors(prev => ({
      ...prev,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "参数不合法",
        message: "请先修正评估参数后再提交。",
      });
      return;
    }

    try {
      const payload: {
        prompt: string;
        modelId?: string;
        temperature?: number;
      } = {
        prompt: prompt.trim(),
      };

      if (evaluateModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = evaluateModelId;
      }

      if (typeof parsedEvaluateTemperature === "number") {
        payload.temperature = parsedEvaluateTemperature;
      }

      const data = unwrapResponseData<EvaluateResponseData>(await sendEvaluate(payload));

      setEvaluationResult(data.evaluationResult);
      setEvaluateResolvedModel(data.resolvedModel);
      setOptimizedPrompt("");
      setOptimizeResolvedModel(null);
      setSaveDraft(null);

      setEvaluateContext({
        modelId: data.resolvedModel.modelId,
        temperature: payload.temperature,
      });

      notice.success({
        title: "评估完成",
        message: "评估结果已更新，可以继续执行优化。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "评估失败",
        onValidationError: (fields) => {
          const mapped: OptimizeFieldErrors = {};
          if (hasField(fields, ["prompt"])) {
            mapped.prompt = true;
          }
          if (hasField(fields, ["temperature"])) {
            mapped.evaluateTemperature = true;
          }
          setFieldErrors(prev => ({ ...prev, ...mapped }));
        },
      });
    }
  };

  const handleOptimize = async () => {
    const nextErrors: OptimizeFieldErrors = {};

    if (!prompt.trim()) {
      nextErrors.prompt = true;
    }

    const parsedOptimizeTemperature = parseOptionalFloat(optimizeTemperature);
    const invalidOptimizeTemperature = parsedOptimizeTemperature === "invalid"
      || (typeof parsedOptimizeTemperature === "number"
        && (parsedOptimizeTemperature < 0 || parsedOptimizeTemperature > 2));
    if (invalidOptimizeTemperature) {
      nextErrors.optimizeTemperature = true;
    }

    setFieldErrors(prev => ({
      ...prev,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      notice.warning({
        title: "参数不合法",
        message: "请先修正优化参数后再提交。",
      });
      return;
    }

    try {
      const payload: {
        prompt: string;
        evaluationResult?: string;
        modelId?: string;
        temperature?: number;
        evaluateContext?: {
          modelId: string;
          temperature?: number;
        };
      } = {
        prompt: prompt.trim(),
      };

      if (evaluationResult.trim().length > 0) {
        payload.evaluationResult = evaluationResult;
      }

      if (evaluateContext) {
        payload.evaluateContext = evaluateContext;
      }

      if (optimizeModelId !== MODEL_DEFAULT_OPTION) {
        payload.modelId = optimizeModelId;
      }

      if (typeof parsedOptimizeTemperature === "number") {
        payload.temperature = parsedOptimizeTemperature;
      }

      const data = unwrapResponseData<OptimizeResponseData>(await sendOptimize(payload));

      setOptimizedPrompt(data.optimizedPrompt);
      setOptimizeResolvedModel(data.resolvedModel);

      if (data.persistence.saved) {
        setSaveDraft(null);
        onPersistedHistory();
        notice.success({
          title: "优化完成",
          message: "优化结果已保存到历史记录。",
        });
      } else if (data.persistence.retryable && data.persistence.saveDraft) {
        setSaveDraft(data.persistence.saveDraft);
        notice.warning({
          title: "优化完成，保存待重试",
          message: "请点击“保存”完成历史记录补保存。",
        });
      } else {
        setSaveDraft(null);
      }
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "优化失败",
        onValidationError: (fields) => {
          const mapped: OptimizeFieldErrors = {};
          if (hasField(fields, ["prompt"])) {
            mapped.prompt = true;
          }
          if (hasField(fields, ["temperature"])) {
            mapped.optimizeTemperature = true;
          }
          setFieldErrors(prev => ({ ...prev, ...mapped }));
        },
      });
    }
  };

  const handleRetrySave = async () => {
    if (!saveDraft) {
      return;
    }

    try {
      await sendRetrySave(saveDraft);

      setSaveDraft(null);
      onPersistedHistory();
      notice.success({
        title: "保存成功",
        message: "优化结果已补保存到历史记录。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "保存失败",
      });
    }
  };

  const copyText = async (text: string, successTitle: string) => {
    try {
      await writeClipboardText(text);
      notice.success({
        title: successTitle,
        message: "内容已复制到剪贴板。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "复制失败",
      });
    }
  };

  return (
    <div className="grid gap-4">
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
                  setPrompt(event.target.value);
                  clearFieldError("prompt");
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
                    <Select value={evaluateModelId} onValueChange={setEvaluateModelId}>
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
                        setEvaluateTemperature(event.target.value);
                        clearFieldError("evaluateTemperature");
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
                    <Select value={optimizeModelId} onValueChange={setOptimizeModelId}>
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
                        setOptimizeTemperature(event.target.value);
                        clearFieldError("optimizeTemperature");
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
            <Button disabled={isEvaluateDisabled || settingsLoading} onClick={handleEvaluate}>
              {evaluatePending && <Loader2 className="mr-1 size-4 animate-spin" />}
              评估
            </Button>
            <Button disabled={isOptimizeDisabled || settingsLoading} onClick={handleOptimize}>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">评估结果</CardTitle>
              {evaluateResolvedModel && (
                <CardDescription>
                  执行模型：
                  {evaluateResolvedModel.modelName}
                </CardDescription>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!evaluationResult}
              onClick={() => copyText(evaluationResult, "评估结果已复制")}
            >
              <Copy className="size-3.5" />
              复制
            </Button>
          </CardHeader>
          <CardContent>
            <div className="min-h-44 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
              {evaluationResult || "暂无评估结果。"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">优化结果</CardTitle>
              {optimizeResolvedModel && (
                <CardDescription>
                  执行模型：
                  {optimizeResolvedModel.modelName}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {saveDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={retryPending}
                  onClick={handleRetrySave}
                >
                  {retryPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  保存
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!optimizedPrompt}
                onClick={() => copyText(optimizedPrompt, "优化结果已复制")}
              >
                <Copy className="size-3.5" />
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-44 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
              {optimizedPrompt || "暂无优化结果。"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
