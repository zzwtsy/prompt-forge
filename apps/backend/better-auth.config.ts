import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import env from "@/env";

/**
 * Better Auth CLI 专用配置。
 *
 * 说明：
 * - `npx @better-auth/cli` 运行在 Node 环境，无法解析 `bun:sqlite`。
 * - `generate` 只依赖 auth 选项与 adapter 元数据，不会执行真实查询。
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean),
  database: drizzleAdapter({} as never, {
    provider: "sqlite",
  }),
});

export default auth;
