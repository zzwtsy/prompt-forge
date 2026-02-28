import modelSettingsRouter from "./model-settings/model-settings.index";
import promptRouter from "./prompt/prompt.index";

const routes = [
  modelSettingsRouter,
  promptRouter,
] as const;

export default routes;
