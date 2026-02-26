import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** 用户主表（与 Better Auth 默认模型保持一致）。 */
export const user = pgTable("user", {
  /** 用户主键。 */
  id: text("id").primaryKey(),
  /** 用户展示名。 */
  name: text("name").notNull(),
  /** 登录邮箱（唯一）。 */
  email: text("email").notNull().unique(),
  /** 邮箱是否已完成验证。 */
  emailVerified: boolean("email_verified").default(false).notNull(),
  /** 用户头像 URL（可空）。 */
  image: text("image"),
  /** 记录创建时间。 */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  /** 记录更新时间。 */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/** 会话表，保存登录态与设备上下文。 */
export const session = pgTable(
  "session",
  {
    /** 会话主键。 */
    id: text("id").primaryKey(),
    /** 会话绝对过期时间。 */
    expiresAt: timestamp("expires_at").notNull(),
    /** 会话令牌（唯一）。 */
    token: text("token").notNull().unique(),
    /** 记录创建时间。 */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** 记录更新时间。 */
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    /** 登录请求来源 IP（可空）。 */
    ipAddress: text("ip_address"),
    /** 终端 UA 字符串（可空）。 */
    userAgent: text("user_agent"),
    /** 归属用户 ID。 */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  table => [index("session_userId_idx").on(table.userId)],
);

/** 账号凭据表，支持多 Provider 登录方式。 */
export const account = pgTable(
  "account",
  {
    /** 账号绑定记录主键。 */
    id: text("id").primaryKey(),
    /** 第三方账号 ID（如 OAuth subject）。 */
    accountId: text("account_id").notNull(),
    /** 第三方 Provider 标识（如 `google`）。 */
    providerId: text("provider_id").notNull(),
    /** 归属用户 ID。 */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Provider 访问令牌（可空）。 */
    accessToken: text("access_token"),
    /** Provider 刷新令牌（可空）。 */
    refreshToken: text("refresh_token"),
    /** OIDC ID Token（可空）。 */
    idToken: text("id_token"),
    /** access token 过期时间（可空）。 */
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    /** refresh token 过期时间（可空）。 */
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    /** OAuth scope（可空）。 */
    scope: text("scope"),
    /** 密码哈希（密码登录场景，可空）。 */
    password: text("password"),
    /** 记录创建时间。 */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** 记录更新时间。 */
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  table => [index("account_userId_idx").on(table.userId)],
);

/** 一次性验证信息表（验证码、找回密码等）。 */
export const verification = pgTable(
  "verification",
  {
    /** 验证记录主键。 */
    id: text("id").primaryKey(),
    /** 业务标识（邮箱/手机号/账户名等）。 */
    identifier: text("identifier").notNull(),
    /** 验证值（验证码、一次性 token）。 */
    value: text("value").notNull(),
    /** 验证信息过期时间。 */
    expiresAt: timestamp("expires_at").notNull(),
    /** 记录创建时间。 */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** 记录更新时间。 */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  table => [index("verification_identifier_idx").on(table.identifier)],
);

/** 用户关系映射。 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

/** 会话关系映射。 */
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

/** 账号关系映射。 */
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
