import type { ModelOption, ProviderItem, SavedPromptItem, WorkbenchTab } from "./types";

export function tabLabel(tab: WorkbenchTab) {
  if (tab === "optimize") {
    return "提示词优化";
  }

  if (tab === "models") {
    return "模型设置";
  }

  return "历史记录";
}

export function getWorkbenchTabFromPathname(pathname: string): WorkbenchTab {
  if (pathname === "/models" || pathname.startsWith("/models/")) {
    return "models";
  }

  if (pathname === "/history" || pathname.startsWith("/history/")) {
    return "history";
  }

  return "optimize";
}

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

export function parseOptionalPositiveInteger(value: string): number | undefined | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
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

export function isValidUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

export function dedupeSavedPromptItems(items: SavedPromptItem[]) {
  const map = new Map<string, SavedPromptItem>();
  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((left, right) => {
    const leftTs = new Date(left.createdAt).getTime();
    const rightTs = new Date(right.createdAt).getTime();

    if (leftTs !== rightTs) {
      return rightTs - leftTs;
    }

    return right.id.localeCompare(left.id, "zh-CN");
  });
}

export function createSnippet(text: string, maxLength = 80) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength)}...`;
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function writeClipboardText(text: string) {
  await navigator.clipboard.writeText(text);
}
