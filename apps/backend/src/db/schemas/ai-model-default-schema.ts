import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { aiModels } from "./ai-model-schema";

export const aiModelDefaults = sqliteTable("ai_model_defaults", {
  id: integer("id").primaryKey(),
  evaluateModelId: text("evaluate_model_id").references(() => aiModels.id, { onDelete: "set null" }),
  optimizeModelId: text("optimize_model_id").references(() => aiModels.id, { onDelete: "set null" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type AiModelDefaults = typeof aiModelDefaults.$inferSelect;
export type NewAiModelDefaults = typeof aiModelDefaults.$inferInsert;
