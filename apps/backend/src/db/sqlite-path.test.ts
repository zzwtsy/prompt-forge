import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ensureLocalSqliteDir, isLocalSqliteDatabaseUrl, resolveLocalSqlitePath } from "./sqlite-path";

const tempRoots: string[] = [];

function createTempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prompt-forge-sqlite-"));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots)
    fs.rmSync(root, { force: true, recursive: true });

  tempRoots.length = 0;
});

describe("resolveLocalSqlitePath", () => {
  it("returns null for in-memory sqlite urls", () => {
    expect(resolveLocalSqlitePath(":memory:")).toBeNull();
    expect(resolveLocalSqlitePath("file::memory:")).toBeNull();
  });

  it("returns null for remote sqlite urls", () => {
    expect(resolveLocalSqlitePath("libsql://db.example.com/app")).toBeNull();
    expect(resolveLocalSqlitePath("https://db.example.com/app")).toBeNull();
  });
});

describe("isLocalSqliteDatabaseUrl", () => {
  it("returns true for local sqlite file urls", () => {
    expect(isLocalSqliteDatabaseUrl("file:prompt-forge-data/data.db")).toBe(true);
    expect(isLocalSqliteDatabaseUrl("sqlite://prompt-forge-data/data.db")).toBe(true);
    expect(isLocalSqliteDatabaseUrl("prompt-forge-data/data.db")).toBe(true);
  });

  it("returns false for unsupported urls", () => {
    expect(isLocalSqliteDatabaseUrl(":memory:")).toBe(false);
    expect(isLocalSqliteDatabaseUrl("file::memory:")).toBe(false);
    expect(isLocalSqliteDatabaseUrl("libsql://db.example.com/app")).toBe(false);
    expect(isLocalSqliteDatabaseUrl("https://db.example.com/app")).toBe(false);
  });
});

describe("ensureLocalSqliteDir", () => {
  it("creates parent directory for file: urls", () => {
    const cwd = createTempRoot();
    ensureLocalSqliteDir("file:prompt-forge-data/data.db", cwd);

    expect(fs.existsSync(path.join(cwd, "prompt-forge-data"))).toBe(true);
  });

  it("creates parent directory for sqlite:// urls", () => {
    const cwd = createTempRoot();
    ensureLocalSqliteDir("sqlite://prompt-forge-data/data.db", cwd);

    expect(fs.existsSync(path.join(cwd, "prompt-forge-data"))).toBe(true);
  });

  it("creates parent directory for bare sqlite paths", () => {
    const cwd = createTempRoot();
    ensureLocalSqliteDir("prompt-forge-data/data.db", cwd);

    expect(fs.existsSync(path.join(cwd, "prompt-forge-data"))).toBe(true);
  });

  it("throws for in-memory sqlite urls", () => {
    const cwd = createTempRoot();
    expect(() => ensureLocalSqliteDir(":memory:", cwd)).toThrowError(/only local SQLite file paths/i);
    expect(() => ensureLocalSqliteDir("file::memory:", cwd)).toThrowError(/only local SQLite file paths/i);

    expect(fs.readdirSync(cwd).length).toBe(0);
  });

  it("throws for remote sqlite urls", () => {
    const cwd = createTempRoot();
    expect(() => ensureLocalSqliteDir("libsql://db.example.com/app", cwd)).toThrowError(/only local SQLite file paths/i);
    expect(() => ensureLocalSqliteDir("https://db.example.com/app", cwd)).toThrowError(/only local SQLite file paths/i);

    expect(fs.readdirSync(cwd).length).toBe(0);
  });
});
