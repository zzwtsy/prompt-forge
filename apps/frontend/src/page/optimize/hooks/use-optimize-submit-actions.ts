import type { OptimizeSubmitActionDeps } from "./optimize-submit-action-types";
import { useOptimizeEvaluateAction } from "./use-optimize-evaluate-action";
import { useOptimizeOptimizeActions } from "./use-optimize-optimize-actions";

export function useOptimizeSubmitActions(deps: OptimizeSubmitActionDeps) {
  const evaluate = useOptimizeEvaluateAction(deps);
  const {
    optimize,
    retrySave,
  } = useOptimizeOptimizeActions(deps);

  return {
    evaluate,
    optimize,
    retrySave,
  };
}
