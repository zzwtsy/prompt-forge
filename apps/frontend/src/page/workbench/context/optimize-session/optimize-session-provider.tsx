import type { ReactNode } from "react";
import type {
  EvaluateContext,
  EvaluateResolvedModel,
  OptimizeFieldErrors,
  OptimizeResolvedModel,
  OptimizeSessionValue,
} from "./optimize-session-context";
import { useMemo, useState } from "react";
import { MODEL_DEFAULT_OPTION } from "../../constants";
import { OptimizeSessionContext } from "./optimize-session-context";

interface OptimizeSessionProviderProps {
  children: ReactNode;
}

export function OptimizeSessionProvider({ children }: OptimizeSessionProviderProps) {
  const [prompt, setPrompt] = useState("");
  const [evaluateModelId, setEvaluateModelId] = useState(MODEL_DEFAULT_OPTION);
  const [optimizeModelId, setOptimizeModelId] = useState(MODEL_DEFAULT_OPTION);
  const [evaluateTemperature, setEvaluateTemperature] = useState("");
  const [evaluateMaxTokens, setEvaluateMaxTokens] = useState("");
  const [optimizeTemperature, setOptimizeTemperature] = useState("");
  const [optimizeMaxTokens, setOptimizeMaxTokens] = useState("");
  const [evaluationResult, setEvaluationResult] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [evaluateResolvedModel, setEvaluateResolvedModel] = useState<EvaluateResolvedModel | null>(null);
  const [optimizeResolvedModel, setOptimizeResolvedModel] = useState<OptimizeResolvedModel | null>(null);
  const [evaluateContext, setEvaluateContext] = useState<EvaluateContext | null>(null);
  const [saveDraft, setSaveDraft] = useState<OptimizeSessionValue["saveDraft"]>(null);
  const [fieldErrors, setFieldErrors] = useState<OptimizeFieldErrors>({});

  const value = useMemo<OptimizeSessionValue>(() => {
    return {
      prompt,
      setPrompt,
      evaluateModelId,
      setEvaluateModelId,
      optimizeModelId,
      setOptimizeModelId,
      evaluateTemperature,
      setEvaluateTemperature,
      evaluateMaxTokens,
      setEvaluateMaxTokens,
      optimizeTemperature,
      setOptimizeTemperature,
      optimizeMaxTokens,
      setOptimizeMaxTokens,
      evaluationResult,
      setEvaluationResult,
      optimizedPrompt,
      setOptimizedPrompt,
      evaluateResolvedModel,
      setEvaluateResolvedModel,
      optimizeResolvedModel,
      setOptimizeResolvedModel,
      evaluateContext,
      setEvaluateContext,
      saveDraft,
      setSaveDraft,
      fieldErrors,
      setFieldErrors,
    };
  }, [
    prompt,
    evaluateModelId,
    optimizeModelId,
    evaluateTemperature,
    evaluateMaxTokens,
    optimizeTemperature,
    optimizeMaxTokens,
    evaluationResult,
    optimizedPrompt,
    evaluateResolvedModel,
    optimizeResolvedModel,
    evaluateContext,
    saveDraft,
    fieldErrors,
  ]);

  return (
    <OptimizeSessionContext value={value}>
      {children}
    </OptimizeSessionContext>
  );
}
