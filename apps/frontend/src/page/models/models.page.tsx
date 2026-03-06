import type { ModelsSections } from "./types";
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { ModelsContent } from "./components/models-content";
import { useCreateModelDialogSection } from "./hooks/use-create-model-dialog-section";
import { useCreateProviderDialogSection } from "./hooks/use-create-provider-dialog-section";
import { useDefaultModelsSection } from "./hooks/use-default-models-section";
import { useModelSettingsResource } from "./hooks/use-model-settings-resource";
import { useProviderModelsSection } from "./hooks/use-provider-models-section";
import { useProviderSettingsSection } from "./hooks/use-provider-settings-section";
import { useProviderSidebarSection } from "./hooks/use-provider-sidebar-section";

export function ModelsPage() {
  const { handleRequestError } = useWorkbenchErrorHandler();

  const resource = useModelSettingsResource({
    onRequestError: handleRequestError,
  });

  const providerSidebar = useProviderSidebarSection({
    providers: resource.providers,
  });

  const defaultModels = useDefaultModelsSection({
    providers: resource.providers,
    defaults: resource.defaults,
    settingsLoading: resource.settingsLoading,
    onRequestError: handleRequestError,
    reloadSettings: resource.reloadSettings,
  });

  const providerSettings = useProviderSettingsSection({
    selectedProvider: providerSidebar.state.selectedProvider,
    settingsLoading: resource.settingsLoading,
    onRequestError: handleRequestError,
    reloadSettings: resource.reloadSettings,
  });

  const providerModels = useProviderModelsSection({
    selectedProvider: providerSidebar.state.selectedProvider,
    onRequestError: handleRequestError,
    reloadSettings: resource.reloadSettings,
  });

  const createProviderDialog = useCreateProviderDialogSection({
    onRequestError: handleRequestError,
    reloadSettings: resource.reloadSettings,
  });

  const createModelDialog = useCreateModelDialogSection({
    selectedProvider: providerSidebar.state.selectedProvider,
    onRequestError: handleRequestError,
    reloadSettings: resource.reloadSettings,
  });

  const sections: ModelsSections = {
    defaultModels,
    providerSidebar,
    providerSettings,
    providerModels,
    createProviderDialog,
    createModelDialog,
  };

  // Keep Content as a container that assembles sections and maps page-level contracts.
  return <ModelsContent sections={sections} />;
}
