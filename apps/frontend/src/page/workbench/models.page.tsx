import { ModelSettingsTab } from "./components/model-settings-tab";
import { useWorkbenchShell } from "./context/workbench-shell";

export function ModelsPage() {
  const {
    providers,
    defaults,
    settingsLoading,
    refreshModelSettings,
    handleRequestError,
    showNotice,
  } = useWorkbenchShell();

  return (
    <ModelSettingsTab
      providers={providers}
      defaults={defaults}
      settingsLoading={settingsLoading}
      refreshSettings={refreshModelSettings}
      onRequestError={handleRequestError}
      onShowNotice={showNotice}
    />
  );
}
