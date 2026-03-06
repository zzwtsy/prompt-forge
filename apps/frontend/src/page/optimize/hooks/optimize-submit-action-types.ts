import type { OptimizePageDeps } from "../types";
import type { OptimizePageResource } from "./use-optimize-page-resource";

export interface OptimizeSubmitActionDeps {
  resource: OptimizePageResource;
  onRequestError: OptimizePageDeps["onRequestError"];
}
