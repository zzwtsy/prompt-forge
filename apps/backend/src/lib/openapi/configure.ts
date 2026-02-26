import type { AppOpenAPI } from "../types";

import { Scalar } from "@scalar/hono-api-reference";

import packageJSON from "../../../package.json" with { type: "json" };

/**
 * 配置 OpenAPI 文档与 API Reference 页面。
 *
 * @param app 应用实例。
 */
export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "Prompt Forge API",
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}
