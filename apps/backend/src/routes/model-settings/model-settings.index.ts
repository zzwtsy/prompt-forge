import { createRouter } from "@/lib/app/create-app";

import {
  createModelHandler,
  createOpenAICompatibleProviderHandler,
  getModelDefaultsHandler,
  listProvidersHandler,
  syncProviderModelsHandler,
  updateModelDefaultsHandler,
  updateModelHandler,
  updateProviderHandler,
} from "./model-settings.handlers";
import {
  createModelRoute,
  createOpenAICompatibleProviderRoute,
  getModelDefaultsRoute,
  listProvidersRoute,
  syncProviderModelsRoute,
  updateModelDefaultsRoute,
  updateModelRoute,
  updateProviderRoute,
} from "./model-settings.routes";

const router = createRouter();

router.openapi(listProvidersRoute, listProvidersHandler);
router.openapi(createOpenAICompatibleProviderRoute, createOpenAICompatibleProviderHandler);
router.openapi(updateProviderRoute, updateProviderHandler);
router.openapi(syncProviderModelsRoute, syncProviderModelsHandler);
router.openapi(createModelRoute, createModelHandler);
router.openapi(updateModelRoute, updateModelHandler);
router.openapi(getModelDefaultsRoute, getModelDefaultsHandler);
router.openapi(updateModelDefaultsRoute, updateModelDefaultsHandler);

export default router;
