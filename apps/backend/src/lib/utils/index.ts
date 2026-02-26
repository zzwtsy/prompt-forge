import type { SQL } from "drizzle-orm";
import type { PgInsertOnConflictDoUpdateConfig, PgInsertValue, PgTable } from "drizzle-orm/pg-core";
import { getTableColumns, sql } from "drizzle-orm";
import { chunk } from "es-toolkit";
import db from "@/db";

/**
 * 构建包含指定列的冲突更新映射
 *
 * 用于 ON CONFLICT DO UPDATE 场景, 当插入数据发生冲突时,
 * 只更新指定的列, 其他列保持不变.
 * 使用 EXCLUDED 表引用新插入的值.
 *
 * @param table - Drizzle ORM 表实例, 包含表结构和元数据
 * @param columns - 需要更新的列名数组
 * @returns 返回列名到 SQL 表达式的映射对象, 格式为 {列名: sql`excluded.列名`}
 *
 * @example
 * // 假设 users 表有 id, name, email 列
 * const updateColumns = buildConflictUpdateColumns(users, ['name', 'email']);
 * // 结果: { name: sql`excluded.name`, email: sql`excluded.email` }
 *
 * // 在插入语句中使用
 * await db.insert(users).values({id: 1, name: 'John', email: 'john@example.com'})
 *   .onConflictDoUpdate({ target: users.id, set: updateColumns });
 */
export function buildConflictUpdateColumns<T extends PgTable, Q extends keyof T["_"]["columns"]>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce((acc, column) => {
    const col = cls[column];
    acc[column] = sql`excluded.${sql.identifier(col.name)}`;
    return acc;
  }, {} as Record<Q, SQL>);
}

/**
 * 构建排除指定列的冲突更新映射
 *
 * 用于 ON CONFLICT DO UPDATE 场景, 当插入数据发生冲突时,
 * 更新除指定列外的所有其他列.
 * 使用 EXCLUDED 表引用新插入的值.
 *
 * @param table - Drizzle ORM 表实例, 包含表结构和元数据
 * @param columns - 需要排除的列名数组( 这些列不会被更新)
 * @returns 返回列名到 SQL 表达式的映射对象, 格式为 {列名: sql`excluded.列名`}
 *
 * @example
 * // 假设 users 表有 id, name, email, createdAt, updatedAt 列
 * const updateColumns = buildConflictUpdateColumnsExclude(users, ['id', 'createdAt']);
 * // 结果: { name: sql`excluded.name`, email: sql`excluded.email`, updatedAt: sql`excluded.updatedAt` }
 *
 * // 在插入语句中使用
 * await db.insert(users).values({id: 1, name: 'John', email: 'john@example.com', createdAt: new Date()})
 *   .onConflictDoUpdate({ target: users.id, set: updateColumns });
 */
export function buildConflictUpdateColumnsExclude<T extends PgTable, Q extends keyof T["_"]["columns"]>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);

  return Object.keys(cls).filter(c => !columns.includes(c as Q)).reduce((acc, column) => {
    const col = cls[column as Q];
    acc[column as Q] = sql`excluded.${sql.identifier(col.name)}`;
    return acc;
  }, {} as Record<Q, SQL>);
}

/**
 * 分批插入数据到数据库
 *
 * Drizzle ORM 在构建大型 INSERT 语句时会递归处理每个值,
 * 当一次性插入大量数据时( 如数千条记录), 会导致 JavaScript 调用栈溢出.
 * 此函数将数据拆分为小批次( 每批默认 100 条)依次插入, 避免堆栈溢出问题.
 *
 * @see https://github.com/drizzle-team/drizzle-orm/pull/3816
 *
 * @template TTable - Drizzle Postgres 表类型
 * @param table - 要插入数据的目标表
 * @param data - 要插入的数据数组
 * @param options - 配置选项
 * @param options.batchSize - 每批插入的数量, 默认为 100
 * @returns 无返回值
 *
 * @example
 * // 插入大量业务订单数据
 * await drizzleBatchInsert(db, businessOrders, validOrders);
 */
export async function drizzleBatchInsert<TTable extends PgTable>(
  table: TTable,
  data: PgInsertValue<TTable>[],
  options: { batchSize?: number } = {},
) {
  const { batchSize = 100 } = options;
  const chunks = chunk(data, batchSize);
  for (const c of chunks) {
    // 注意：按批次串行执行，避免超长 SQL 构建导致调用栈溢出。
    await db.insert(table).values(c);
  }
}

/**
 * 分批插入或更新数据到数据库( Upsert)
 *
 * 与 `drizzleBatchInsert` 类似, 但支持 `onConflict` 选项.
 *
 * @see https://github.com/drizzle-team/drizzle-orm/pull/3816
 *
 * @template TTable - Drizzle Postgres 表类型
 * @param table - 要插入数据的目标表
 * @param data - 要插入的数据数组
 * @param onConflictConfig - 冲突处理配置
 * @param options - 配置选项
 * @param options.batchSize - 每批插入的数量, 默认为 100
 * @returns 无返回值
 *
 * @example
 * // 插入或更新业务订单数据, 冲突时更新除 id/createdAt 外的列
 * await drizzleBatchUpsert(
 *   db,
 *   businessOrders,
 *   validOrders,
 *   {
 *     type: 'update',
 *     config: {
 *       target: businessOrders.id,
 *       set: buildConflictUpdateColumnsExclude(businessOrders, ["id", "createdAt"]),
 *     }
 *   }
 * );
 */
export async function drizzleBatchUpsert<TTable extends PgTable>(
  table: TTable,
  data: PgInsertValue<TTable>[],
  onConflictConfig:
    | { type: "update"; config: PgInsertOnConflictDoUpdateConfig<any> }
    | { type: "nothing"; config?: { target?: any; where?: SQL } },
  options: { batchSize?: number } = {},
) {
  const { batchSize = 100 } = options;
  const chunks = chunk(data, batchSize);
  for (const c of chunks) {
    const insertBuilder = db.insert(table).values(c);
    if (onConflictConfig.type === "update") {
      insertBuilder.onConflictDoUpdate(onConflictConfig.config);
    } else {
      insertBuilder.onConflictDoNothing(onConflictConfig.config);
    }
    await insertBuilder;
  }
}
