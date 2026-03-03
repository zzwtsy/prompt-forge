import type {
  GlobalNotice,
  ModelDefaultsData,
  NoticeInput,
  ProviderItem,
  RequestErrorOptions,
} from "../../types";
import { createContext } from "react";

export interface WorkbenchShellValue {
  providers: ProviderItem[];
  defaults: ModelDefaultsData;
  settingsLoading: boolean;
  notice: GlobalNotice | null;
  showNotice: (input: NoticeInput) => void;
  clearNotice: () => void;
  handleRequestError: (error: unknown, options: RequestErrorOptions) => void;
  refreshModelSettings: (silent?: boolean) => Promise<boolean>;
  historyRefreshToken: number;
  bumpHistoryRefreshToken: () => void;
}

export const WorkbenchShellContext = createContext<WorkbenchShellValue | null>(null);
