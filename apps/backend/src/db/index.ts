import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

import env from "@/env";
import * as schemas from "./schemas";

const client = new SQL(env.DATABASE_URL);

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
