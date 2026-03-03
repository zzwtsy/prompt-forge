import type { Dispatch, SetStateAction } from "react";
import type { SignedSaveDraft } from "../../types";
import { createContext } from "react";

export interface OptimizeFieldErrors {
  prompt?: boolean;
  evaluateTemperature?: boolean;
  evaluateMaxTokens?: boolean;
  optimizeTemperature?: boolean;
  optimizeMaxTokens?: boolean;
}

export interface OptimizeResolvedModel {
  modelName: string;
}

export interface EvaluateResolvedModel extends OptimizeResolvedModel {
  modelId: string;
}

export interface EvaluateContext {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OptimizeSessionValue {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  evaluateModelId: string;
  setEvaluateModelId: Dispatch<SetStateAction<string>>;
  optimizeModelId: string;
  setOptimizeModelId: Dispatch<SetStateAction<string>>;
  evaluateTemperature: string;
  setEvaluateTemperature: Dispatch<SetStateAction<string>>;
  evaluateMaxTokens: string;
  setEvaluateMaxTokens: Dispatch<SetStateAction<string>>;
  optimizeTemperature: string;
  setOptimizeTemperature: Dispatch<SetStateAction<string>>;
  optimizeMaxTokens: string;
  setOptimizeMaxTokens: Dispatch<SetStateAction<string>>;
  evaluationResult: string;
  setEvaluationResult: Dispatch<SetStateAction<string>>;
  optimizedPrompt: string;
  setOptimizedPrompt: Dispatch<SetStateAction<string>>;
  evaluateResolvedModel: EvaluateResolvedModel | null;
  setEvaluateResolvedModel: Dispatch<SetStateAction<EvaluateResolvedModel | null>>;
  optimizeResolvedModel: OptimizeResolvedModel | null;
  setOptimizeResolvedModel: Dispatch<SetStateAction<OptimizeResolvedModel | null>>;
  evaluateContext: EvaluateContext | null;
  setEvaluateContext: Dispatch<SetStateAction<EvaluateContext | null>>;
  saveDraft: SignedSaveDraft | null;
  setSaveDraft: Dispatch<SetStateAction<SignedSaveDraft | null>>;
  fieldErrors: OptimizeFieldErrors;
  setFieldErrors: Dispatch<SetStateAction<OptimizeFieldErrors>>;
}

export const OptimizeSessionContext = createContext<OptimizeSessionValue | null>(null);
