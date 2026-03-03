export interface RuntimeModel {
  providerId: string;
  providerKind: "openai" | "openai-compatible";
  modelId: string;
  modelName: string;
}

export interface PromptCallParams {
  temperature?: number;
  maxTokens?: number;
}

export interface SaveDraftPayload {
  promptRunId: string;
  savedPromptId: string;
  originalPrompt: string;
  evaluationResult: string | null;
  optimizedPrompt: string;
  evaluateModelId: string | null;
  optimizeModelId: string;
  evaluateParams: PromptCallParams | null;
  optimizeParams: PromptCallParams | null;
  createdAt: string;
}

export interface SignedSaveDraft {
  version: "v1";
  issuedAt: string;
  expiresAt: string;
  payload: SaveDraftPayload;
  signature: string;
}

export interface EvaluateResponseData {
  evaluationResult: string;
  resolvedModel: RuntimeModel;
}

export interface OptimizeResponseData {
  optimizedPrompt: string;
  resolvedModel: RuntimeModel;
  promptRunId: string;
  savedPromptId: string;
  persistence: {
    saved: boolean;
    retryable: boolean;
    saveDraft?: SignedSaveDraft;
  };
}

export interface RetrySaveResponseData {
  promptRunId: string;
  savedPromptId: string;
  saved: true;
}

export interface ModelItem {
  id: string;
  providerId: string;
  modelName: string;
  displayName: string | null;
  enabled: boolean;
  source: "sync" | "manual";
  lastSyncedAt: string | null;
}

export interface ProviderItem {
  id: string;
  kind: "openai" | "openai-compatible";
  code: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  models: ModelItem[];
}

export interface ModelDefaultsData {
  evaluateModelId: string | null;
  optimizeModelId: string | null;
}

export interface SavedPromptItem {
  id: string;
  promptRunId: string;
  optimizedPrompt: string;
  createdAt: string;
}

export interface ModelOption {
  id: string;
  label: string;
}
