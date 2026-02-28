import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import env from "@/env";
import * as schemas from "./schemas";
import { ensureLocalSqliteDir } from "./sqlite-path";

ensureLocalSqliteDir(env.DATABASE_URL);
const client = new Database(env.DATABASE_URL);

/**
 * @description 全局 Drizzle 数据库实例。初始化阶段会建立连接池配置，但不会立即执行业务查询。
 * @throws {Error} 当数据库连接配置非法时，运行时可能在首次查询时抛出连接错误。
 */
const db = drizzle({
  client,
  casing: "snake_case",
  schema: schemas,
});

export default db;
