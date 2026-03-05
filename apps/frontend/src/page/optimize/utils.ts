import type { ModelOption, ProviderItem } from "@/lib/workbench-api";

export function parseOptionalFloat(value: string): number | undefined | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return "invalid";
  }

  return parsed;
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

export async function writeClipboardText(text: string) {
  await navigator.clipboard.writeText(text);
}
