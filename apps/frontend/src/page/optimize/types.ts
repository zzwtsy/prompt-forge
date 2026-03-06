import type { ModelOption, SignedSaveDraft } from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";
import type {
  EvaluateResolvedModel,
  OptimizeFieldErrors,
  OptimizeResolvedModel,
} from "@/store";

export interface OptimizePageDeps {
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
}

export interface OptimizePageState {
  prompt: string;
  evaluateModelId: string;
  optimizeModelId: string;
  evaluateTemperature: string;
  optimizeTemperature: string;
  evaluationResult: string;
  optimizedPrompt: string;
  evaluateResolvedModel: EvaluateResolvedModel | null;
  optimizeResolvedModel: OptimizeResolvedModel | null;
  saveDraft: SignedSaveDraft | null;
  fieldErrors: OptimizeFieldErrors;
  modelOptions: ModelOption[];
  settingsLoading: boolean;
  evaluatePending: boolean;
  optimizePending: boolean;
  retryPending: boolean;
  isEvaluateDisabled: boolean;
  isOptimizeDisabled: boolean;
}

export interface OptimizePageActions {
  setPrompt: (value: string) => void;
  setEvaluateModelId: (value: string) => void;
  setOptimizeModelId: (value: string) => void;
  setEvaluateTemperature: (value: string) => void;
  setOptimizeTemperature: (value: string) => void;
  evaluate: () => Promise<void>;
  optimize: () => Promise<void>;
  retrySave: () => Promise<void>;
  copyEvaluation: () => Promise<void>;
  copyOptimized: () => Promise<void>;
}
