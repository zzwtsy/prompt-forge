import Apis from "@/api";

interface SaveModelDefaultsPayload {
  evaluateModelId: string | null;
  optimizeModelId: string | null;
}

interface SaveProviderSettingsPayload {
  providerId: string;
  data: {
    name: string;
    baseUrl: string;
    enabled: boolean;
    apiKey?: string;
  };
}

interface SaveModelPayload {
  modelId: string;
  data: {
    enabled?: boolean;
    displayName?: string | null;
  };
}

interface CreateProviderPayload {
  name: string;
  baseUrl: string;
  apiKey?: string;
}

interface CreateModelPayload {
  providerId: string;
  modelName: string;
  displayName?: string;
}

export const modelSettingsMethods = {
  queryProviders() {
    return Apis.ModelSettings.get_api_providers();
  },
  queryDefaults() {
    return Apis.ModelSettings.get_api_model_defaults();
  },
  saveDefaults(payload: SaveModelDefaultsPayload) {
    return Apis.ModelSettings.put_api_model_defaults({
      data: payload,
    });
  },
  saveProviderSettings(payload: SaveProviderSettingsPayload) {
    const apiKey = payload.data.apiKey?.trim();

    return Apis.ModelSettings.put_api_providers_provider_id({
      pathParams: { providerId: payload.providerId },
      data: {
        ...payload.data,
        name: payload.data.name.trim(),
        baseUrl: payload.data.baseUrl.trim(),
        apiKey: apiKey === undefined ? undefined : apiKey,
      },
    });
  },
  syncProviderModels(providerId: string) {
    return Apis.ModelSettings.post_api_providers_provider_id_models_sync({
      pathParams: { providerId },
    });
  },
  saveModel(payload: SaveModelPayload) {
    return Apis.ModelSettings.put_api_models_model_id({
      pathParams: { modelId: payload.modelId },
      data: payload.data,
    });
  },
  createOpenAICompatibleProvider(payload: CreateProviderPayload) {
    const apiKey = payload.apiKey?.trim();

    return Apis.ModelSettings.post_api_providers_openai_compatible({
      data: {
        name: payload.name.trim(),
        baseUrl: payload.baseUrl.trim(),
        apiKey: apiKey !== undefined && apiKey.length > 0 ? apiKey : undefined,
      },
    });
  },
  createModel(payload: CreateModelPayload) {
    const displayName = payload.displayName?.trim();

    return Apis.ModelSettings.post_api_models({
      data: {
        providerId: payload.providerId,
        modelName: payload.modelName.trim(),
        displayName: displayName !== undefined && displayName.length > 0 ? displayName : undefined,
      },
    });
  },
};
