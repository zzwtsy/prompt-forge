import { useWorkbenchShellStore } from "@/lib/store";
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { HistoryTab } from "./components/history-tab";

export function HistoryPage() {
  const historyRefreshToken = useWorkbenchShellStore(state => state.historyRefreshToken);
  const showNotice = useWorkbenchShellStore(state => state.showNotice);
  const { handleRequestError } = useWorkbenchErrorHandler();

  return (
    <HistoryTab
      refreshToken={historyRefreshToken}
      onRequestError={handleRequestError}
      onShowNotice={showNotice}
    />
  );
}
