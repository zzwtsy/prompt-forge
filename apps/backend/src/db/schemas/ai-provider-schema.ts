import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const aiProviders = sqliteTable("ai_providers", {
  id: text("id").primaryKey(),
  kind: text("kind", {
    enum: ["openai", "openai-compatible"],
  }).notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKeyCiphertext: text("api_key_ciphertext"),
  enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type AiProvider = typeof aiProviders.$inferSelect;
export type NewAiProvider = typeof aiProviders.$inferInsert;
