import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // 注意：测试环境与运行时保持相同路径别名，避免导入路径行为不一致。
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    sequence: {
      // 注意：数据库集成测试依赖共享状态，默认串行执行更稳定。
      concurrent: false,
    },
  },
});
