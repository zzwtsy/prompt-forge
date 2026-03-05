import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";
import { HistoryTab } from "./components/history-tab";

export function HistoryPage() {
  const historyRefreshToken = useWorkbenchShellStore(state => state.historyRefreshToken);
  const { handleRequestError } = useWorkbenchErrorHandler();

  return (
    <HistoryTab
      refreshToken={historyRefreshToken}
      onRequestError={handleRequestError}
    />
  );
}
