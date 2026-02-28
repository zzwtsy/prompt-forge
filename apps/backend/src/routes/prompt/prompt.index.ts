import { createRouter } from "@/lib/app/create-app";

import { evaluatePromptHandler, optimizePromptHandler } from "./prompt.handlers";
import { evaluatePromptRoute, optimizePromptRoute } from "./prompt.routes";

const router = createRouter();

router.openapi(evaluatePromptRoute, evaluatePromptHandler);
router.openapi(optimizePromptRoute, optimizePromptHandler);

export default router;
