import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import db from "@/db";
import env from "@/env";

/**
 * Better Auth 全局实例。
 *
 * 注意：`secret` 变更会导致已签发凭证失效，生产环境需稳定配置。
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  // secret 用于签名/加密等安全用途；必须保持私密且稳定
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  // 允许跨域携带凭证访问的来源白名单( 避免 CSRF/滥用)
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  plugins: [
    ...(env.NODE_ENV === "development" ? [openAPI()] : []),
  ],
});

/** Better Auth 会话推导类型（含 `user` 与 `session`）。 */
export type AuthSession = typeof auth.$Infer.Session;
