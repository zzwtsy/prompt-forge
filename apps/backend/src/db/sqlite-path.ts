import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REMOTE_SQLITE_PREFIXES = ["libsql://", "http://", "https://", "ws://", "wss://"] as const;
const FILE_URL_PREFIX = "file://";
const FILE_PREFIX = "file:";
const SQLITE_URL_PREFIX = "sqlite://";
const SQLITE_PREFIX = "sqlite:";

function stripQueryAndHash(value: string): string {
  return value.replace(/[?#].*$/, "");
}

/**
 * 判断 DATABASE_URL 是否为受支持的本地 SQLite 文件路径。
 */
export function isLocalSqliteDatabaseUrl(databaseUrl: string): boolean {
  return resolveLocalSqlitePath(databaseUrl) != null;
}

/**
 * 解析 DATABASE_URL 对应的本地 SQLite 文件路径。
 *
 * @returns 本地数据库文件路径；远程或内存数据库返回 null。
 */
export function resolveLocalSqlitePath(databaseUrl: string): string | null {
  const normalizedUrl = stripQueryAndHash(databaseUrl.trim());
  const loweredUrl = normalizedUrl.toLowerCase();

  if (normalizedUrl.length === 0)
    return null;

  if (loweredUrl === ":memory:" || loweredUrl === "file::memory:")
    return null;

  if (REMOTE_SQLITE_PREFIXES.some(prefix => loweredUrl.startsWith(prefix)))
    return null;

  if (loweredUrl.startsWith(FILE_URL_PREFIX))
    return fileURLToPath(normalizedUrl);

  if (loweredUrl.startsWith(FILE_PREFIX)) {
    const localPath = normalizedUrl.slice(FILE_PREFIX.length);
    return localPath.length > 0 ? localPath : null;
  }

  if (loweredUrl.startsWith(SQLITE_URL_PREFIX)) {
    const localPath = normalizedUrl.slice(SQLITE_URL_PREFIX.length);
    return localPath.length > 0 ? localPath : null;
  }

  if (loweredUrl.startsWith(SQLITE_PREFIX)) {
    const localPath = normalizedUrl.slice(SQLITE_PREFIX.length);
    return localPath.length > 0 ? localPath : null;
  }

  return normalizedUrl;
}

/**
 * 为本地 SQLite 数据库文件确保父目录存在。
 */
export function ensureLocalSqliteDir(databaseUrl: string, cwd = process.cwd()): void {
  const localSqlitePath = resolveLocalSqlitePath(databaseUrl);

  if (localSqlitePath == null) {
    throw new Error(`Unsupported DATABASE_URL: only local SQLite file paths are supported. Received: ${databaseUrl}`);
  }

  const absoluteDbFilePath = path.isAbsolute(localSqlitePath)
    ? localSqlitePath
    : path.resolve(cwd, localSqlitePath);

  fs.mkdirSync(path.dirname(absoluteDbFilePath), { recursive: true });
}
