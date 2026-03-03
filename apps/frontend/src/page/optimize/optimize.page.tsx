import { useWorkbenchShellStore } from "@/lib/store";
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { OptimizeTab } from "./components/optimize-tab";

export function OptimizePage() {
  const providers = useWorkbenchShellStore(state => state.providers);
  const providersLoading = useWorkbenchShellStore(state => state.providersLoading);
  const defaultsLoading = useWorkbenchShellStore(state => state.defaultsLoading);
  const showNotice = useWorkbenchShellStore(state => state.showNotice);
  const bumpHistoryRefreshToken = useWorkbenchShellStore(state => state.bumpHistoryRefreshToken);
  const { handleRequestError } = useWorkbenchErrorHandler();

  return (
    <OptimizeTab
      providers={providers}
      settingsLoading={providersLoading || defaultsLoading}
      onRequestError={handleRequestError}
      onShowNotice={showNotice}
      onPersistedHistory={bumpHistoryRefreshToken}
    />
  );
}
