import type {
  OptimizePageActions,
  OptimizePageState,
} from "../types";
import { EvaluationResultCard } from "./evaluation-result-card";
import { OptimizeFormCard } from "./optimize-form-card";
import { OptimizedResultCard } from "./optimized-result-card";

interface OptimizeContentProps {
  state: OptimizePageState;
  actions: OptimizePageActions;
}

export function OptimizeContent(props: OptimizeContentProps) {
  const {
    state,
    actions,
  } = props;

  return (
    <div className="grid gap-4">
      <OptimizeFormCard
        prompt={state.prompt}
        evaluateModelId={state.evaluateModelId}
        optimizeModelId={state.optimizeModelId}
        evaluateTemperature={state.evaluateTemperature}
        optimizeTemperature={state.optimizeTemperature}
        fieldErrors={state.fieldErrors}
        modelOptions={state.modelOptions}
        settingsLoading={state.settingsLoading}
        isEvaluateDisabled={state.isEvaluateDisabled}
        isOptimizeDisabled={state.isOptimizeDisabled}
        evaluatePending={state.evaluatePending}
        optimizePending={state.optimizePending}
        onPromptChange={actions.setPrompt}
        onEvaluateModelChange={actions.setEvaluateModelId}
        onOptimizeModelChange={actions.setOptimizeModelId}
        onEvaluateTemperatureChange={actions.setEvaluateTemperature}
        onOptimizeTemperatureChange={actions.setOptimizeTemperature}
        onEvaluate={actions.evaluate}
        onOptimize={actions.optimize}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <EvaluationResultCard
          evaluationResult={state.evaluationResult}
          evaluateResolvedModel={state.evaluateResolvedModel}
          onCopy={actions.copyEvaluation}
        />

        <OptimizedResultCard
          optimizedPrompt={state.optimizedPrompt}
          optimizeResolvedModel={state.optimizeResolvedModel}
          hasSaveDraft={state.saveDraft !== null}
          retryPending={state.retryPending}
          onRetrySave={actions.retrySave}
          onCopy={actions.copyOptimized}
        />
      </div>
    </div>
  );
}
