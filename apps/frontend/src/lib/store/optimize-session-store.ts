import type { SignedSaveDraft } from "@/lib/workbench-api";
import { create } from "zustand";
import { MODEL_DEFAULT_OPTION } from "@/lib/workbench-shell";

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

interface OptimizeSessionStoreState {
  prompt: string;
  evaluateModelId: string;
  optimizeModelId: string;
  evaluateTemperature: string;
  evaluateMaxTokens: string;
  optimizeTemperature: string;
  optimizeMaxTokens: string;
  evaluationResult: string;
  optimizedPrompt: string;
  evaluateResolvedModel: EvaluateResolvedModel | null;
  optimizeResolvedModel: OptimizeResolvedModel | null;
  evaluateContext: EvaluateContext | null;
  saveDraft: SignedSaveDraft | null;
  fieldErrors: OptimizeFieldErrors;
  setPrompt: (prompt: string) => void;
  setEvaluateModelId: (evaluateModelId: string) => void;
  setOptimizeModelId: (optimizeModelId: string) => void;
  setEvaluateTemperature: (evaluateTemperature: string) => void;
  setEvaluateMaxTokens: (evaluateMaxTokens: string) => void;
  setOptimizeTemperature: (optimizeTemperature: string) => void;
  setOptimizeMaxTokens: (optimizeMaxTokens: string) => void;
  setEvaluationResult: (evaluationResult: string) => void;
  setOptimizedPrompt: (optimizedPrompt: string) => void;
  setEvaluateResolvedModel: (evaluateResolvedModel: EvaluateResolvedModel | null) => void;
  setOptimizeResolvedModel: (optimizeResolvedModel: OptimizeResolvedModel | null) => void;
  setEvaluateContext: (evaluateContext: EvaluateContext | null) => void;
  setSaveDraft: (saveDraft: SignedSaveDraft | null) => void;
  setFieldErrors: (
    fieldErrors: OptimizeFieldErrors | ((previous: OptimizeFieldErrors) => OptimizeFieldErrors),
  ) => void;
  resetOptimizeSessionStore: () => void;
}

const initialState = {
  prompt: "",
  evaluateModelId: MODEL_DEFAULT_OPTION,
  optimizeModelId: MODEL_DEFAULT_OPTION,
  evaluateTemperature: "",
  evaluateMaxTokens: "",
  optimizeTemperature: "",
  optimizeMaxTokens: "",
  evaluationResult: "",
  optimizedPrompt: "",
  evaluateResolvedModel: null,
  optimizeResolvedModel: null,
  evaluateContext: null,
  saveDraft: null,
  fieldErrors: {},
};

export const useOptimizeSessionStore = create<OptimizeSessionStoreState>(set => ({
  ...initialState,
  setPrompt: prompt => set({ prompt }),
  setEvaluateModelId: evaluateModelId => set({ evaluateModelId }),
  setOptimizeModelId: optimizeModelId => set({ optimizeModelId }),
  setEvaluateTemperature: evaluateTemperature => set({ evaluateTemperature }),
  setEvaluateMaxTokens: evaluateMaxTokens => set({ evaluateMaxTokens }),
  setOptimizeTemperature: optimizeTemperature => set({ optimizeTemperature }),
  setOptimizeMaxTokens: optimizeMaxTokens => set({ optimizeMaxTokens }),
  setEvaluationResult: evaluationResult => set({ evaluationResult }),
  setOptimizedPrompt: optimizedPrompt => set({ optimizedPrompt }),
  setEvaluateResolvedModel: evaluateResolvedModel => set({ evaluateResolvedModel }),
  setOptimizeResolvedModel: optimizeResolvedModel => set({ optimizeResolvedModel }),
  setEvaluateContext: evaluateContext => set({ evaluateContext }),
  setSaveDraft: saveDraft => set({ saveDraft }),
  setFieldErrors: fieldErrors => set(state => ({
    fieldErrors: typeof fieldErrors === "function" ? fieldErrors(state.fieldErrors) : fieldErrors,
  })),
  resetOptimizeSessionStore: () => set({ ...initialState }),
}));

export function resetOptimizeSessionStore() {
  useOptimizeSessionStore.getState().resetOptimizeSessionStore();
}
