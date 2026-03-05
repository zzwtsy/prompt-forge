import type { ModelOption, ProviderItem } from "@/lib/workbench-api";

export function unwrapResponseData<T>(response: T | { data: T }): T;
export function unwrapResponseData<T>(response: T | { data: T } | undefined): T | undefined;
export function unwrapResponseData<T>(response: T | { data: T } | undefined): T | undefined {
  if (response === undefined) {
    return undefined;
  }

  return (typeof response === "object" && response !== null && "data" in response)
    ? response.data as T
    : response;
}

export function hasField(fieldPaths: Set<string>, fields: string[]) {
  if (fieldPaths.size === 0) {
    return false;
  }

  for (const path of fieldPaths) {
    if (fields.some(field => path === field || path.endsWith(`.${field}`))) {
      return true;
    }
  }

  return false;
}

export function getEnabledModelOptions(providers: ProviderItem[]): ModelOption[] {
  return providers
    .filter(provider => provider.enabled)
    .flatMap(provider => provider.models
      .filter(model => model.enabled)
      .map(model => ({
        id: model.id,
        label: `${provider.name} / ${model.displayName ?? model.modelName}`,
      })))
    .sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
}

export async function writeClipboardText(text: string) {
  await navigator.clipboard.writeText(text);
}
