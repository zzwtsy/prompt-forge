import type { RetrySaveResponseData, SavedPromptItem, SignedSaveDraft } from "../types";
import Apis from "@/api";
import { unwrapApiEnvelope } from "@/lib/api-envelope";

export async function fetchSavedPrompts(params: {
  limit: number;
  cursor?: string;
}) {
  const response = await Apis.SavedPrompts.get_api_saved_prompts({
    params,
  }).send();

  return unwrapApiEnvelope<{ items: SavedPromptItem[]; nextCursor: string | null }>(response);
}

export async function retrySavePrompt(saveDraft: SignedSaveDraft) {
  const response = await Apis.SavedPrompts.post_api_saved_prompts_retry({
    data: { saveDraft },
  }).send();

  return unwrapApiEnvelope<RetrySaveResponseData>(response);
}
