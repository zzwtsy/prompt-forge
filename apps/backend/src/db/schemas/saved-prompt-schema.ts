import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { promptRuns } from "./prompt-run-schema";

export const savedPrompts = sqliteTable(
  "saved_prompts",
  {
    id: text("id").primaryKey(),
    promptRunId: text("prompt_run_id")
      .notNull()
      .references(() => promptRuns.id, { onDelete: "cascade" }),
    optimizedPrompt: text("optimized_prompt").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  table => [
    uniqueIndex("saved_prompts_prompt_run_id_unique").on(table.promptRunId),
    index("saved_prompts_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type NewSavedPrompt = typeof savedPrompts.$inferInsert;
