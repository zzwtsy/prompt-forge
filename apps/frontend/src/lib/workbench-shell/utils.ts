import type { WorkbenchTab } from "./types";

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
