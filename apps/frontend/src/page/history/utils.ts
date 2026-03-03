import type { SavedPromptItem } from "@/lib/workbench-api";

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
