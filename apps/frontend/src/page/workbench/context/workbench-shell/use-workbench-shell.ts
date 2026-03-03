import { use } from "react";
import { WorkbenchShellContext } from "./workbench-shell-context";

export function useWorkbenchShell() {
  const value = use(WorkbenchShellContext);

  if (value === null) {
    throw new Error("useWorkbenchShell must be used within WorkbenchShellProvider");
  }

  return value;
}
