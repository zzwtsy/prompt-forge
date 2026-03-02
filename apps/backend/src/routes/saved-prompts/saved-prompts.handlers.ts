import type { listSavedPromptsRoute, retrySavedPromptRoute } from "./saved-prompts.routes";

import type { AppRouteHandler } from "@/lib/types";

import { listSavedPrompts, retryPersistSavedPrompt } from "@/lib/prompt/prompt-history-service";
import { ok } from "@/lib/utils/http";

export const listSavedPromptsHandler: AppRouteHandler<typeof listSavedPromptsRoute> = async (c) => {
  const query = c.req.valid("query");
  const result = await listSavedPrompts({
    limit: query.limit,
    cursor: query.cursor,
  });

  return ok(c, result);
};

export const retrySavedPromptHandler: AppRouteHandler<typeof retrySavedPromptRoute> = async (c) => {
  const body = c.req.valid("json");
  const result = await retryPersistSavedPrompt(body.saveDraft);

  return ok(c, result);
};
