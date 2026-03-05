import type { ModelDefaultsData, ProviderItem } from "@/lib/workbench-api";
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
  historyRefreshToken: number;
  setProviders: (providers: ProviderItem[]) => void;
  setDefaults: (defaults: ModelDefaultsData) => void;
  setProvidersLoading: (loading: boolean) => void;
  setDefaultsLoading: (loading: boolean) => void;
  bumpHistoryRefreshToken: () => void;
  resetWorkbenchShellStore: () => void;
}

const initialState = {
  providers: [],
  defaults: EMPTY_DEFAULTS,
  providersLoading: false,
  defaultsLoading: false,
  historyRefreshToken: 0,
};

export const useWorkbenchShellStore = create<WorkbenchShellStoreState>(set => ({
  ...initialState,
  setProviders: providers => set({ providers }),
  setDefaults: defaults => set({ defaults }),
  setProvidersLoading: providersLoading => set({ providersLoading }),
  setDefaultsLoading: defaultsLoading => set({ defaultsLoading }),
  bumpHistoryRefreshToken: () => set(state => ({
    historyRefreshToken: state.historyRefreshToken + 1,
  })),
  resetWorkbenchShellStore: () => set({ ...initialState }),
}));

export function resetWorkbenchShellStore() {
  useWorkbenchShellStore.getState().resetWorkbenchShellStore();
}
