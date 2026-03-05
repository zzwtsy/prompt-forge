import type {
  ModelSettingsControllerActions,
  ModelSettingsControllerState,
} from "../types";
import { CreateModelDialog } from "./create-model-dialog";
import { CreateProviderDialog } from "./create-provider-dialog";
import { DefaultModelsCard } from "./default-models-card";
import { ProviderSettingsCard } from "./provider-settings-card";
import { ProviderSidebar } from "./provider-sidebar";

interface ModelsContentProps {
  state: ModelSettingsControllerState;
  actions: ModelSettingsControllerActions;
}

export function ModelsContent(props: ModelsContentProps) {
  const {
    state,
    actions,
  } = props;

  return (
    <div className="grid gap-4">
      <DefaultModelsCard
        defaultEvaluateModelId={state.defaultEvaluateModelId}
        defaultOptimizeModelId={state.defaultOptimizeModelId}
        defaultModelOptions={state.defaultModelOptions}
        savingDefaults={state.savingDefaults}
        settingsLoading={state.settingsLoading}
        onEvaluateModelChange={actions.setDefaultEvaluateModelId}
        onOptimizeModelChange={actions.setDefaultOptimizeModelId}
        onSave={actions.saveDefaults}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ProviderSidebar
          providers={state.filteredProviders}
          activeProviderId={state.activeProviderId}
          providerSearch={state.providerSearch}
          onProviderSearchChange={actions.setProviderSearch}
          onSelectProvider={actions.selectProvider}
          onOpenAddProvider={() => actions.openAddProvider(true)}
        />

        <ProviderSettingsCard
          selectedProvider={state.selectedProvider}
          selectedProviderDraft={state.selectedProviderDraft}
          models={state.filteredModels}
          validationErrors={state.validationErrors}
          modelSearch={state.modelSearch}
          modelDisplayDrafts={state.modelDisplayDrafts}
          togglingModelIds={state.togglingModelIds}
          savingDisplayNameIds={state.savingDisplayNameIds}
          savingProvider={state.savingProvider}
          syncingModels={state.syncingModels}
          settingsLoading={state.settingsLoading}
          onSelectedProviderNameChange={actions.setSelectedProviderName}
          onSelectedProviderBaseUrlChange={actions.setSelectedProviderBaseUrl}
          onSelectedProviderApiKeyChange={actions.setSelectedProviderApiKey}
          onToggleSelectedProviderEnabled={actions.toggleSelectedProviderEnabled}
          onToggleSelectedProviderClearApiKey={actions.toggleSelectedProviderClearApiKey}
          onSaveProvider={actions.saveProvider}
          onSyncModels={actions.syncModels}
          onOpenAddModel={() => actions.openAddModel(true)}
          onModelSearchChange={actions.setModelSearch}
          onToggleModel={actions.toggleModel}
          onModelDisplayNameChange={actions.setModelDisplayDraft}
          onSaveModelDisplayName={actions.saveModelDisplayName}
        />
      </div>

      <CreateProviderDialog
        open={state.addProviderOpen}
        name={state.addProviderName}
        baseUrl={state.addProviderBaseUrl}
        apiKey={state.addProviderApiKey}
        adding={state.addingProvider}
        nameInvalid={!!state.validationErrors.addProviderName}
        baseUrlInvalid={!!state.validationErrors.addProviderBaseUrl}
        onOpenChange={actions.openAddProvider}
        onNameChange={actions.setAddProviderName}
        onBaseUrlChange={actions.setAddProviderBaseUrl}
        onApiKeyChange={actions.setAddProviderApiKey}
        onCreate={actions.createProvider}
      />

      <CreateModelDialog
        open={state.addModelOpen}
        modelName={state.addModelName}
        displayName={state.addModelDisplayName}
        adding={state.addingModel}
        modelNameInvalid={!!state.validationErrors.addModelName}
        providerAvailable={state.selectedProvider !== null}
        onOpenChange={actions.openAddModel}
        onModelNameChange={actions.setAddModelName}
        onDisplayNameChange={actions.setAddModelDisplayName}
        onCreate={actions.createModel}
      />
    </div>
  );
}
