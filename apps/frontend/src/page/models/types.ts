import type {
  ModelItem,
  ModelOption,
  ProviderItem,
} from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";

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

export interface ModelSettingsSectionDeps {
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
  reloadSettings: (silent?: boolean) => Promise<boolean>;
}

export interface DefaultModelsSectionState {
  settingsLoading: boolean;
  defaultModelOptions: ModelOption[];
  defaultEvaluateModelId: string;
  defaultOptimizeModelId: string;
  savingDefaults: boolean;
}

export interface DefaultModelsSectionActions {
  setDefaultEvaluateModelId: (value: string) => void;
  setDefaultOptimizeModelId: (value: string) => void;
  saveDefaults: () => Promise<void>;
}

export interface ProviderSidebarSectionState {
  providerSearch: string;
  filteredProviders: ProviderItem[];
  activeProviderId: string | null;
  selectedProvider: ProviderItem | null;
}

export interface ProviderSidebarSectionActions {
  setProviderSearch: (value: string) => void;
  selectProvider: (providerId: string) => void;
}

export interface ProviderSettingsSectionState {
  selectedProvider: ProviderItem | null;
  selectedProviderDraft: ProviderFormDraft | null;
  validationErrors: Pick<ModelSettingsValidationErrors, "providerName" | "providerBaseUrl">;
  savingProvider: boolean;
  syncingModels: boolean;
  settingsLoading: boolean;
}

export interface ProviderSettingsSectionActions {
  setSelectedProviderName: (value: string) => void;
  setSelectedProviderBaseUrl: (value: string) => void;
  setSelectedProviderApiKey: (value: string) => void;
  toggleSelectedProviderEnabled: () => void;
  toggleSelectedProviderClearApiKey: () => void;
  saveProvider: () => Promise<void>;
  syncModels: () => Promise<void>;
}

export interface ProviderModelsSectionState {
  modelSearch: string;
  filteredModels: ModelItem[];
  modelDisplayDrafts: Record<string, string>;
  togglingModelIds: Set<string>;
  savingDisplayNameIds: Set<string>;
}

export interface ProviderModelsSectionActions {
  setModelSearch: (value: string) => void;
  toggleModel: (model: ModelItem) => Promise<void>;
  setModelDisplayDraft: (modelId: string, value: string) => void;
  saveModelDisplayName: (model: ModelItem) => Promise<void>;
}

export interface CreateProviderDialogSectionState {
  open: boolean;
  name: string;
  baseUrl: string;
  apiKey: string;
  validationErrors: Pick<ModelSettingsValidationErrors, "addProviderName" | "addProviderBaseUrl">;
  addingProvider: boolean;
}

export interface CreateProviderDialogSectionActions {
  setOpen: (open: boolean) => void;
  setName: (value: string) => void;
  setBaseUrl: (value: string) => void;
  setApiKey: (value: string) => void;
  createProvider: () => Promise<void>;
}

export interface CreateModelDialogSectionState {
  open: boolean;
  modelName: string;
  displayName: string;
  validationErrors: Pick<ModelSettingsValidationErrors, "addModelName">;
  providerAvailable: boolean;
  addingModel: boolean;
}

export interface CreateModelDialogSectionActions {
  setOpen: (open: boolean) => void;
  setModelName: (value: string) => void;
  setDisplayName: (value: string) => void;
  createModel: () => Promise<void>;
}
