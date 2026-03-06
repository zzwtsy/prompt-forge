import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { OptimizeContent } from "./components/optimize-content";
import { useOptimizePageState } from "./hooks/use-optimize-page-state";

export function OptimizePage() {
  const { handleRequestError } = useWorkbenchErrorHandler();
  const {
    state,
    actions,
  } = useOptimizePageState({
    onRequestError: handleRequestError,
  });

  // Keep Content as a container for multi-block composition and state/action mapping.
  return <OptimizeContent state={state} actions={actions} />;
}
