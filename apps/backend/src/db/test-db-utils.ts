import { sql } from "drizzle-orm";

import db from "@/db";

/**
 * 为测试场景准备模型设置相关表结构。
 */
export async function ensureModelSettingsTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_providers (
      id text PRIMARY KEY NOT NULL,
      kind text NOT NULL,
      code text NOT NULL,
      name text NOT NULL,
      base_url text NOT NULL,
      api_key_ciphertext text,
      enabled integer DEFAULT false NOT NULL,
      created_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
      updated_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ai_providers_code_unique
      ON ai_providers (code);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_models (
      id text PRIMARY KEY NOT NULL,
      provider_id text NOT NULL,
      model_name text NOT NULL,
      display_name text,
      enabled integer DEFAULT true NOT NULL,
      source text NOT NULL,
      raw text,
      last_synced_at integer,
      created_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
      updated_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
      FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE cascade
    );
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ai_models_provider_id_idx
      ON ai_models (provider_id);
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_id_model_name_unique
      ON ai_models (provider_id, model_name);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_model_defaults (
      id integer PRIMARY KEY NOT NULL,
      evaluate_model_id text,
      optimize_model_id text,
      updated_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
      FOREIGN KEY (evaluate_model_id) REFERENCES ai_models(id) ON DELETE set null,
      FOREIGN KEY (optimize_model_id) REFERENCES ai_models(id) ON DELETE set null
    );
  `);
}

/**
 * 清空模型设置相关测试数据，保证用例隔离。
 */
export async function clearModelSettingsTables() {
  await db.execute(sql`DELETE FROM ai_model_defaults;`);
  await db.execute(sql`DELETE FROM ai_models;`);
  await db.execute(sql`DELETE FROM ai_providers;`);
}
