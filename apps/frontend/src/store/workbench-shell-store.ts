import type { ModelDefaultsData, ProviderItem } from "@/lib/workbench-api";
import type { GlobalNotice, NoticeInput } from "@/lib/workbench-shell";
import { create } from "zustand";

const EMPTY_DEFAULTS: ModelDefaultsData = {
  evaluateModelId: null,
  optimizeModelId: null,
};

interface WorkbenchShellStoreState {
  providers: ProviderItem[];
  defaults: ModelDefaultsData;
  providersLoading: boolean;
  defaultsLoading: boolean;
  notice: GlobalNotice | null;
  historyRefreshToken: number;
  setProviders: (providers: ProviderItem[]) => void;
  setDefaults: (defaults: ModelDefaultsData) => void;
  setProvidersLoading: (loading: boolean) => void;
  setDefaultsLoading: (loading: boolean) => void;
  showNotice: (input: NoticeInput) => void;
  clearNotice: () => void;
  bumpHistoryRefreshToken: () => void;
  resetWorkbenchShellStore: () => void;
}

const initialState = {
  providers: [],
  defaults: EMPTY_DEFAULTS,
  providersLoading: false,
  defaultsLoading: false,
  notice: null,
  historyRefreshToken: 0,
};

export const useWorkbenchShellStore = create<WorkbenchShellStoreState>(set => ({
  ...initialState,
  setProviders: providers => set({ providers }),
  setDefaults: defaults => set({ defaults }),
  setProvidersLoading: providersLoading => set({ providersLoading }),
  setDefaultsLoading: defaultsLoading => set({ defaultsLoading }),
  showNotice: input => set({
    notice: {
      id: Date.now(),
      ...input,
    },
  }),
  clearNotice: () => set({ notice: null }),
  bumpHistoryRefreshToken: () => set(state => ({
    historyRefreshToken: state.historyRefreshToken + 1,
  })),
  resetWorkbenchShellStore: () => set({ ...initialState }),
}));

export function resetWorkbenchShellStore() {
  useWorkbenchShellStore.getState().resetWorkbenchShellStore();
}
