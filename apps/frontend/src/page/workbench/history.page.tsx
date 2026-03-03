import { HistoryTab } from "./components/history-tab";
import { useWorkbenchShell } from "./context/workbench-shell";

export function HistoryPage() {
  const {
    historyRefreshToken,
    handleRequestError,
    showNotice,
  } = useWorkbenchShell();

  return (
    <HistoryTab
      refreshToken={historyRefreshToken}
      onRequestError={handleRequestError}
      onShowNotice={showNotice}
    />
  );
}
