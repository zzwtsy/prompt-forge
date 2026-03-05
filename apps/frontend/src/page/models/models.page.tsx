import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { ModelsContent } from "./components/models-content";
import { useModelSettingsController } from "./hooks/use-model-settings-controller";

export function ModelsPage() {
  const { handleRequestError } = useWorkbenchErrorHandler();
  const {
    state,
    actions,
  } = useModelSettingsController({
    onRequestError: handleRequestError,
  });

  return <ModelsContent state={state} actions={actions} />;
}
