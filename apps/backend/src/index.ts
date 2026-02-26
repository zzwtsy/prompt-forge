import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import app from "@/app";

import env from "@/env";
import { logger } from "@/lib/logger";

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

logger.info(`Server is running on http://localhost:${server.port}`);
if (env.NODE_ENV === "development") {
  logger.info(`➜ API Reference:  http://localhost:${server.port}/reference`);
  logger.info(`➜ Auth Reference: http://localhost:${server.port}/api/auth/reference`);
}
const faviconPath = path.join(process.cwd(), "public", "favicon.ico");
if (!fs.existsSync(faviconPath)) {
  logger.warn(`Favicon not found at ${faviconPath}`);
}
