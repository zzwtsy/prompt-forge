import type { SavedPromptItem } from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";

export interface HistoryPageDeps {
  refreshToken: number;
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
}

export interface HistoryPageState {
  items: SavedPromptItem[];
  filteredItems: SavedPromptItem[];
  selectedItem: SavedPromptItem | null;
  activeItemId: string | null;
  searchKeyword: string;
  nextCursor: string | null;
  initialLoading: boolean;
  loadingMore: boolean;
}

export interface HistoryPageActions {
  setSearchKeyword: (keyword: string) => void;
  selectItem: (itemId: string) => void;
  loadMore: () => Promise<void>;
  copyPrompt: (text: string) => Promise<void>;
}
