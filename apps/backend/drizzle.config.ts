import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  // 注意：schema 路径用于生成迁移，不影响运行时查询逻辑。
  schema: "./src/db/schemas/**/*.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
