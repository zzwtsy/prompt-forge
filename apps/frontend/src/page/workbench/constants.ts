import type { WorkbenchTab } from "./types";

export const MODEL_DEFAULT_OPTION = "__default__";
export const MODEL_NONE_OPTION = "__none__";
export const HISTORY_PAGE_LIMIT = 20;

export const WORKBENCH_TAB_PATHS: Record<WorkbenchTab, string> = {
  optimize: "/optimize",
  models: "/models",
  history: "/history",
};

export const WORKBENCH_TABS: WorkbenchTab[] = ["optimize", "models", "history"];
