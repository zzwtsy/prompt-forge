import { createRouter } from "@/lib/app/create-app";

import { listSavedPromptsHandler, retrySavedPromptHandler } from "./saved-prompts.handlers";
import { listSavedPromptsRoute, retrySavedPromptRoute } from "./saved-prompts.routes";

const router = createRouter();

router.openapi(listSavedPromptsRoute, listSavedPromptsHandler);
router.openapi(retrySavedPromptRoute, retrySavedPromptHandler);

export default router;
