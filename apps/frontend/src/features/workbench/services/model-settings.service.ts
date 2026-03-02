import type { ModelDefaultsData, ModelItem, ProviderItem } from "../types";
import Apis from "@/api";
import { unwrapApiEnvelope } from "@/lib/api-envelope";

export async function fetchModelSettings() {
  const [providersResp, defaultsResp] = await Promise.all([
    Apis.ModelSettings.get_api_providers().send(),
    Apis.ModelSettings.get_api_model_defaults().send(),
  ]);

  return {
    providers: unwrapApiEnvelope<{ providers: ProviderItem[] }>(providersResp).providers,
    defaults: unwrapApiEnvelope<ModelDefaultsData>(defaultsResp),
  };
}

export async function saveModelDefaults(payload: {
  evaluateModelId: string | null;
  optimizeModelId: string | null;
}) {
  const response = await Apis.ModelSettings.put_api_model_defaults({
    data: payload,
  }).send();

  return unwrapApiEnvelope<ModelDefaultsData>(response);
}

export async function saveProviderSettings(
  providerId: string,
  payload: {
    name: string;
    baseUrl: string;
    enabled: boolean;
    apiKey?: string;
  },
) {
  const response = await Apis.ModelSettings.put_api_providers_provider_id({
    pathParams: { providerId },
    data: payload,
  }).send();

  return unwrapApiEnvelope<{ provider: ProviderItem }>(response).provider;
}

export async function syncProviderModels(providerId: string) {
  const response = await Apis.ModelSettings.post_api_providers_provider_id_models_sync({
    pathParams: { providerId },
  }).send();

  return unwrapApiEnvelope<{ added: number; updated: number; total: number }>(response);
}

export async function saveModel(
  modelId: string,
  payload: {
    enabled?: boolean;
    displayName?: string | null;
  },
) {
  const response = await Apis.ModelSettings.put_api_models_model_id({
    pathParams: { modelId },
    data: payload,
  }).send();

  return unwrapApiEnvelope<{ model: ModelItem }>(response).model;
}

export async function createOpenAICompatibleProvider(payload: {
  name: string;
  baseUrl: string;
  apiKey?: string;
}) {
  const response = await Apis.ModelSettings.post_api_providers_openai_compatible({
    data: payload,
  }).send();

  return unwrapApiEnvelope<{ providerId: string }>(response);
}

export async function createModel(payload: {
  providerId: string;
  modelName: string;
  displayName?: string;
}) {
  const response = await Apis.ModelSettings.post_api_models({
    data: payload,
  }).send();

  return unwrapApiEnvelope<{ modelId: string }>(response);
}
