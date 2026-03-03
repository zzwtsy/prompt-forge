import type { SignedSaveDraft } from "../types";
import Apis from "@/api";

interface QuerySavedPromptsParams {
  limit: number;
  cursor?: string;
}

export const savedPromptsMethods = {
  querySavedPrompts(params: QuerySavedPromptsParams) {
    return Apis.SavedPrompts.get_api_saved_prompts({
      params: {
        limit: params.limit,
        cursor: params.cursor,
      },
    });
  },
  retrySavePrompt(saveDraft: SignedSaveDraft) {
    return Apis.SavedPrompts.post_api_saved_prompts_retry({
      data: { saveDraft },
    });
  },
};
