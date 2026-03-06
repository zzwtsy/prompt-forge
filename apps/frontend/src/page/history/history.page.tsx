import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";
import { HistoryDetailPanel } from "./components/history-detail-panel";
import { HistoryListPanel } from "./components/history-list-panel";
import { HistoryToolbarCard } from "./components/history-toolbar-card";
import { useHistoryPageState } from "./hooks/use-history-page-state";

export function HistoryPage() {
  const historyRefreshToken = useWorkbenchShellStore(state => state.historyRefreshToken);
  const { handleRequestError } = useWorkbenchErrorHandler();
  const {
    state,
    actions,
  } = useHistoryPageState({
    refreshToken: historyRefreshToken,
    onRequestError: handleRequestError,
  });

  return (
    <div className="grid gap-4">
      <HistoryToolbarCard
        searchKeyword={state.searchKeyword}
        onSearchKeywordChange={actions.setSearchKeyword}
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <HistoryListPanel
          items={state.items}
          filteredItems={state.filteredItems}
          activeItemId={state.activeItemId}
          nextCursor={state.nextCursor}
          initialLoading={state.initialLoading}
          loadingMore={state.loadingMore}
          onSelectItem={actions.selectItem}
          onCopyPrompt={actions.copyPrompt}
          onLoadMore={actions.loadMore}
        />
        <HistoryDetailPanel
          selectedItem={state.selectedItem}
          onCopyPrompt={actions.copyPrompt}
        />
      </div>
    </div>
  );
}
