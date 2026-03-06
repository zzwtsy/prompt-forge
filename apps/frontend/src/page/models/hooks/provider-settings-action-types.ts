import type {
  Dispatch,
  SetStateAction,
} from "react";
import type {
  ModelSettingsSectionDeps,
  ProviderFormDraft,
} from "../types";
import type { ProviderSettingsValidationErrors } from "./use-provider-settings-draft-state";
import type { ProviderItem } from "@/lib/workbench-api";

export interface ProviderSettingsActionDeps extends ModelSettingsSectionDeps {
  selectedProvider: ProviderItem | null;
  selectedProviderDraft: ProviderFormDraft | null;
  setValidationErrors: Dispatch<SetStateAction<ProviderSettingsValidationErrors>>;
  updateSelectedProviderDraft: (updater: (draft: ProviderFormDraft) => ProviderFormDraft) => void;
}
