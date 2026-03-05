import type { SavedPromptItem } from "@/lib/workbench-api";
import type { RequestErrorOptions } from "@/lib/workbench-shell";

export interface HistoryControllerDeps {
  refreshToken: number;
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
}

export interface HistoryControllerState {
  items: SavedPromptItem[];
  filteredItems: SavedPromptItem[];
  selectedItem: SavedPromptItem | null;
  activeItemId: string | null;
  searchKeyword: string;
  nextCursor: string | null;
  initialLoading: boolean;
  loadingMore: boolean;
}

export interface HistoryControllerActions {
  setSearchKeyword: (keyword: string) => void;
  selectItem: (itemId: string) => void;
  loadMore: () => Promise<void>;
  copyPrompt: (text: string) => Promise<void>;
}
