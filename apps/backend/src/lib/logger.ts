import type { TransportMultiOptions } from "pino";
import path from "node:path";
import process from "node:process";
import pino from "pino";
import packageJSON from "../../package.json" with { type: "json" };
import "pino-roll";

const env = process.env;

// 注意：直接从 process.env 读取可避免与 env.ts 的循环依赖。
const LOG_LEVEL = env.LOG_LEVEL ?? "info";
const NODE_ENV = env.NODE_ENV ?? "production";
const LOG_MAX_FILES = env.LOG_MAX_FILES != null ? Number(env.LOG_MAX_FILES) : 90;
const LOG_REMOVE_OTHER_FILES = env.LOG_REMOVE_OTHER_FILES === "true";
const APP_NAME = packageJSON.name;

const pinoPretty = {
  level: LOG_LEVEL,
  target: "pino-pretty",
};

const pinoRoll = {
  level: LOG_LEVEL,
  target: "pino-roll",
  options: {
    file: path.join(process.cwd(), "logs", APP_NAME),
    extension: ".log",
    frequency: "daily",
    limit: {
      count: LOG_MAX_FILES,
      removeOtherLogFiles: LOG_REMOVE_OTHER_FILES,
    },
    dateFormat: "yyyy-MM-dd",
    compress: true,
    mkdir: true,
  },
};

const targets: TransportMultiOptions["targets"] = [
  ...(NODE_ENV === "development" ? [pinoPretty] : []),
  pinoRoll,
];

/** 应用全局日志实例（控制台 + 文件滚动）。 */
export const logger = pino({
  level: LOG_LEVEL,
  transport: {
    targets,
  },
});
