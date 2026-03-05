import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { OptimizeContent } from "./components/optimize-content";
import { useOptimizeController } from "./hooks/use-optimize-controller";

export function OptimizePage() {
  const { handleRequestError } = useWorkbenchErrorHandler();
  const {
    state,
    actions,
  } = useOptimizeController({
    onRequestError: handleRequestError,
  });

  return <OptimizeContent state={state} actions={actions} />;
}
