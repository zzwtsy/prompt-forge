import { use } from "react";
import { OptimizeSessionContext } from "./optimize-session-context";

export function useOptimizeSession() {
  const value = use(OptimizeSessionContext);

  if (value === null) {
    throw new Error("useOptimizeSession must be used within OptimizeSessionProvider");
  }

  return value;
}
