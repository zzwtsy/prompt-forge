import type { ModelsSections } from "../types";
import { CreateModelDialog } from "./create-model-dialog";
import { CreateProviderDialog } from "./create-provider-dialog";
import { DefaultModelsCard } from "./default-models-card";
import { ProviderSettingsCard } from "./provider-settings-card";
import { ProviderSidebar } from "./provider-sidebar";

interface ModelsContentProps {
  sections: ModelsSections;
}

export function ModelsContent(props: ModelsContentProps) {
  const { sections } = props;

  return (
    <div className="grid gap-4">
      <DefaultModelsCard section={sections.defaultModels} />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ProviderSidebar
          section={sections.providerSidebar}
          onOpenAddProvider={() => sections.createProviderDialog.actions.setOpen(true)}
        />

        <ProviderSettingsCard
          settingsSection={sections.providerSettings}
          modelsSection={sections.providerModels}
          onOpenAddModel={() => sections.createModelDialog.actions.setOpen(true)}
        />
      </div>

      <CreateProviderDialog section={sections.createProviderDialog} />

      <CreateModelDialog section={sections.createModelDialog} />
    </div>
  );
}
