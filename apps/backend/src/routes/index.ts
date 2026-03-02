import modelSettingsRouter from "./model-settings/model-settings.index";
import promptRouter from "./prompt/prompt.index";
import savedPromptsRouter from "./saved-prompts/saved-prompts.index";

const routes = [
  modelSettingsRouter,
  promptRouter,
  savedPromptsRouter,
] as const;

export default routes;
