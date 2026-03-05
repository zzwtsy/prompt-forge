import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { aiModels } from "./ai-model-schema";

export interface PromptCallParams {
  temperature?: number;
}

export const promptRuns = sqliteTable(
  "prompt_runs",
  {
    id: text("id").primaryKey(),
    originalPrompt: text("original_prompt").notNull(),
    evaluationResult: text("evaluation_result"),
    optimizedPrompt: text("optimized_prompt").notNull(),
    evaluateModelId: text("evaluate_model_id").references(() => aiModels.id, { onDelete: "set null" }),
    optimizeModelId: text("optimize_model_id")
      .notNull()
      .references(() => aiModels.id, { onDelete: "restrict" }),
    evaluateParams: text("evaluate_params", { mode: "json" }).$type<PromptCallParams | null>(),
    optimizeParams: text("optimize_params", { mode: "json" }).$type<PromptCallParams | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  table => [
    index("prompt_runs_created_at_idx").on(table.createdAt),
  ],
);

export type PromptRun = typeof promptRuns.$inferSelect;
export type NewPromptRun = typeof promptRuns.$inferInsert;
