import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { aiProviders } from "./ai-provider-schema";

export const aiModels = sqliteTable(
  "ai_models",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => aiProviders.id, { onDelete: "cascade" }),
    modelName: text("model_name").notNull(),
    displayName: text("display_name"),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    source: text("source", {
      enum: ["sync", "manual"],
    }).notNull(),
    raw: text("raw"),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  table => [
    index("ai_models_provider_id_idx").on(table.providerId),
    uniqueIndex("ai_models_provider_id_model_name_unique").on(table.providerId, table.modelName),
  ],
);

export type AiModel = typeof aiModels.$inferSelect;
export type NewAiModel = typeof aiModels.$inferInsert;
