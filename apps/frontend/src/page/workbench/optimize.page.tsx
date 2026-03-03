import { OptimizeTab } from "./components/optimize-tab";
import { useWorkbenchShell } from "./context/workbench-shell";

export function OptimizePage() {
  const {
    providers,
    settingsLoading,
    handleRequestError,
    showNotice,
    bumpHistoryRefreshToken,
  } = useWorkbenchShell();

  return (
    <OptimizeTab
      providers={providers}
      settingsLoading={settingsLoading}
      onRequestError={handleRequestError}
      onShowNotice={showNotice}
      onPersistedHistory={bumpHistoryRefreshToken}
    />
  );
}
