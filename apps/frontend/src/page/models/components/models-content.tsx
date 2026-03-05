import type {
  CreateModelDialogSectionActions,
  CreateModelDialogSectionState,
  CreateProviderDialogSectionActions,
  CreateProviderDialogSectionState,
  DefaultModelsSectionActions,
  DefaultModelsSectionState,
  ProviderModelsSectionActions,
  ProviderModelsSectionState,
  ProviderSettingsSectionActions,
  ProviderSettingsSectionState,
  ProviderSidebarSectionActions,
  ProviderSidebarSectionState,
} from "../types";
import { CreateModelDialog } from "./create-model-dialog";
import { CreateProviderDialog } from "./create-provider-dialog";
import { DefaultModelsCard } from "./default-models-card";
import { ProviderSettingsCard } from "./provider-settings-card";
import { ProviderSidebar } from "./provider-sidebar";

interface ModelsContentProps {
  defaultModels: {
    state: DefaultModelsSectionState;
    actions: DefaultModelsSectionActions;
  };
  providerSidebar: {
    state: ProviderSidebarSectionState;
    actions: ProviderSidebarSectionActions;
  };
  providerSettings: {
    state: ProviderSettingsSectionState;
    actions: ProviderSettingsSectionActions;
  };
  providerModels: {
    state: ProviderModelsSectionState;
    actions: ProviderModelsSectionActions;
  };
  createProviderDialog: {
    state: CreateProviderDialogSectionState;
    actions: CreateProviderDialogSectionActions;
  };
  createModelDialog: {
    state: CreateModelDialogSectionState;
    actions: CreateModelDialogSectionActions;
  };
}

export function ModelsContent(props: ModelsContentProps) {
  const {
    defaultModels,
    providerSidebar,
    providerSettings,
    providerModels,
    createProviderDialog,
    createModelDialog,
  } = props;

  return (
    <div className="grid gap-4">
      <DefaultModelsCard
        defaultEvaluateModelId={defaultModels.state.defaultEvaluateModelId}
        defaultOptimizeModelId={defaultModels.state.defaultOptimizeModelId}
        defaultModelOptions={defaultModels.state.defaultModelOptions}
        savingDefaults={defaultModels.state.savingDefaults}
        settingsLoading={defaultModels.state.settingsLoading}
        onEvaluateModelChange={defaultModels.actions.setDefaultEvaluateModelId}
        onOptimizeModelChange={defaultModels.actions.setDefaultOptimizeModelId}
        onSave={defaultModels.actions.saveDefaults}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ProviderSidebar
          providers={providerSidebar.state.filteredProviders}
          activeProviderId={providerSidebar.state.activeProviderId}
          providerSearch={providerSidebar.state.providerSearch}
          onProviderSearchChange={providerSidebar.actions.setProviderSearch}
          onSelectProvider={providerSidebar.actions.selectProvider}
          onOpenAddProvider={() => createProviderDialog.actions.setOpen(true)}
        />

        <ProviderSettingsCard
          selectedProvider={providerSettings.state.selectedProvider}
          selectedProviderDraft={providerSettings.state.selectedProviderDraft}
          models={providerModels.state.filteredModels}
          validationErrors={providerSettings.state.validationErrors}
          modelSearch={providerModels.state.modelSearch}
          modelDisplayDrafts={providerModels.state.modelDisplayDrafts}
          togglingModelIds={providerModels.state.togglingModelIds}
          savingDisplayNameIds={providerModels.state.savingDisplayNameIds}
          savingProvider={providerSettings.state.savingProvider}
          syncingModels={providerSettings.state.syncingModels}
          settingsLoading={providerSettings.state.settingsLoading}
          onSelectedProviderNameChange={providerSettings.actions.setSelectedProviderName}
          onSelectedProviderBaseUrlChange={providerSettings.actions.setSelectedProviderBaseUrl}
          onSelectedProviderApiKeyChange={providerSettings.actions.setSelectedProviderApiKey}
          onToggleSelectedProviderEnabled={providerSettings.actions.toggleSelectedProviderEnabled}
          onToggleSelectedProviderClearApiKey={providerSettings.actions.toggleSelectedProviderClearApiKey}
          onSaveProvider={providerSettings.actions.saveProvider}
          onSyncModels={providerSettings.actions.syncModels}
          onOpenAddModel={() => createModelDialog.actions.setOpen(true)}
          onModelSearchChange={providerModels.actions.setModelSearch}
          onToggleModel={providerModels.actions.toggleModel}
          onModelDisplayNameChange={providerModels.actions.setModelDisplayDraft}
          onSaveModelDisplayName={providerModels.actions.saveModelDisplayName}
        />
      </div>

      <CreateProviderDialog
        open={createProviderDialog.state.open}
        name={createProviderDialog.state.name}
        baseUrl={createProviderDialog.state.baseUrl}
        apiKey={createProviderDialog.state.apiKey}
        adding={createProviderDialog.state.addingProvider}
        nameInvalid={!!createProviderDialog.state.validationErrors.addProviderName}
        baseUrlInvalid={!!createProviderDialog.state.validationErrors.addProviderBaseUrl}
        onOpenChange={createProviderDialog.actions.setOpen}
        onNameChange={createProviderDialog.actions.setName}
        onBaseUrlChange={createProviderDialog.actions.setBaseUrl}
        onApiKeyChange={createProviderDialog.actions.setApiKey}
        onCreate={createProviderDialog.actions.createProvider}
      />

      <CreateModelDialog
        open={createModelDialog.state.open}
        modelName={createModelDialog.state.modelName}
        displayName={createModelDialog.state.displayName}
        adding={createModelDialog.state.addingModel}
        modelNameInvalid={!!createModelDialog.state.validationErrors.addModelName}
        providerAvailable={createModelDialog.state.providerAvailable}
        onOpenChange={createModelDialog.actions.setOpen}
        onModelNameChange={createModelDialog.actions.setModelName}
        onDisplayNameChange={createModelDialog.actions.setDisplayName}
        onCreate={createModelDialog.actions.createModel}
      />
    </div>
  );
}
