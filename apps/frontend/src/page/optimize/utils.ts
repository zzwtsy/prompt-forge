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
