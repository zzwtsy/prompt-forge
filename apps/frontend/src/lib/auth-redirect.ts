const LOGIN_PATH = "/login";
const DEFAULT_REDIRECT_TARGET = "/optimize";

interface LocationLike {
  href?: string;
  pathname?: string;
  search?: unknown;
}

export function buildLoginRedirectTarget(location: LocationLike): string {
  if (typeof location.href === "string" && location.href.startsWith("/")) {
    return location.href;
  }

  const pathname = typeof location.pathname === "string" && location.pathname.startsWith("/")
    ? location.pathname
    : DEFAULT_REDIRECT_TARGET;
  const search = typeof location.search === "string" ? location.search : "";

  return `${pathname}${search}`;
}

export function sanitizeRedirectTarget(raw: unknown): string {
  if (typeof raw !== "string") {
    return DEFAULT_REDIRECT_TARGET;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_REDIRECT_TARGET;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (!target.startsWith("/") || target.startsWith("//")) {
      return DEFAULT_REDIRECT_TARGET;
    }

    if (target === LOGIN_PATH || target.startsWith(`${LOGIN_PATH}?`)) {
      return DEFAULT_REDIRECT_TARGET;
    }

    return target;
  } catch {
    return DEFAULT_REDIRECT_TARGET;
  }
}
