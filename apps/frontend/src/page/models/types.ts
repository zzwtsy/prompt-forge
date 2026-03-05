import type {
  ModelDefaultsData,
  ModelItem,
  ModelOption,
  ProviderItem,
} from "@/lib/workbench-api";

export interface ModelSettingsValidationErrors {
  providerName?: boolean;
  providerBaseUrl?: boolean;
  addProviderName?: boolean;
  addProviderBaseUrl?: boolean;
  addModelName?: boolean;
}

export interface ProviderFormDraft {
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  clearApiKey: boolean;
}

export interface ModelSettingsControllerState {
  providers: ProviderItem[];
  defaults: ModelDefaultsData;
  settingsLoading: boolean;
  defaultModelOptions: ModelOption[];
  defaultEvaluateModelId: string;
  defaultOptimizeModelId: string;
  providerSearch: string;
  modelSearch: string;
  filteredProviders: ProviderItem[];
  activeProviderId: string | null;
  selectedProvider: ProviderItem | null;
  selectedProviderDraft: ProviderFormDraft | null;
  filteredModels: ModelItem[];
  modelDisplayDrafts: Record<string, string>;
  addProviderOpen: boolean;
  addProviderName: string;
  addProviderBaseUrl: string;
  addProviderApiKey: string;
  addModelOpen: boolean;
  addModelName: string;
  addModelDisplayName: string;
  validationErrors: ModelSettingsValidationErrors;
  togglingModelIds: Set<string>;
  savingDisplayNameIds: Set<string>;
  savingDefaults: boolean;
  savingProvider: boolean;
  syncingModels: boolean;
  addingProvider: boolean;
  addingModel: boolean;
}

export interface ModelSettingsControllerActions {
  setDefaultEvaluateModelId: (value: string) => void;
  setDefaultOptimizeModelId: (value: string) => void;
  saveDefaults: () => Promise<void>;
  setProviderSearch: (value: string) => void;
  setModelSearch: (value: string) => void;
  selectProvider: (providerId: string) => void;
  setSelectedProviderName: (value: string) => void;
  setSelectedProviderBaseUrl: (value: string) => void;
  setSelectedProviderApiKey: (value: string) => void;
  toggleSelectedProviderEnabled: () => void;
  toggleSelectedProviderClearApiKey: () => void;
  saveProvider: () => Promise<void>;
  syncModels: () => Promise<void>;
  openAddProvider: (open: boolean) => void;
  setAddProviderName: (value: string) => void;
  setAddProviderBaseUrl: (value: string) => void;
  setAddProviderApiKey: (value: string) => void;
  createProvider: () => Promise<void>;
  openAddModel: (open: boolean) => void;
  setAddModelName: (value: string) => void;
  setAddModelDisplayName: (value: string) => void;
  createModel: () => Promise<void>;
  toggleModel: (model: ModelItem) => Promise<void>;
  setModelDisplayDraft: (modelId: string, value: string) => void;
  saveModelDisplayName: (model: ModelItem) => Promise<void>;
}
