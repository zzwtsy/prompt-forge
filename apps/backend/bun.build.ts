/* eslint-disable no-console */
import { cpSync, existsSync, rmSync } from "node:fs";
import process from "node:process";

import { build, env } from "bun";

const start = performance.now();
console.log("🚀 Starting build...");

// 清空 dist 目录
rmSync("./dist", { recursive: true, force: true });

const NODE_ENV = env.NODE_ENV ?? "production";
const isProd = NODE_ENV === "production";

// eslint-disable-next-line antfu/no-top-level-await
const result = await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  minify: isProd
    ? {
        whitespace: true,
        syntax: true,
        identifiers: true,
      }
    : false,
  sourcemap: isProd ? "none" : "inline",
  bytecode: true,
  // 注意：生产构建会移除 console/debugger，排障时请使用结构化日志。
  drop: isProd ? ["debugger", "console"] : undefined,
});

if (!result.success) {
  console.error("❌ Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// 复制 /public 目录到 /dist
if (existsSync("./public")) {
  cpSync("./public", "./dist/public", { recursive: true });
  console.log("📂 Copied public directory");
}

const end = performance.now();
console.log(`✅ Build completed in ${(end - start).toFixed(2)}ms`);
