import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import env from "@/env";

const KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 12;
const VERSION = "v1";

let cachedProviderSecretKey: Buffer | null = null;

function getProviderSecretKey() {
  if (cachedProviderSecretKey != null)
    return cachedProviderSecretKey;

  const decodedKey = Buffer.from(env.AI_PROVIDER_SECRET_KEY, "base64");
  if (decodedKey.byteLength !== KEY_BYTE_LENGTH) {
    throw new Error("AI_PROVIDER_SECRET_KEY 必须是 base64 编码且解码后为 32 字节");
  }

  cachedProviderSecretKey = decodedKey;
  return cachedProviderSecretKey;
}

function encodeBase64(value: Buffer) {
  return value.toString("base64");
}

function decodeBase64(value: string) {
  return Buffer.from(value, "base64");
}

/**
 * 加密服务商 API Key，返回可存储的版本化密文串。
 *
 * 格式：`v1:iv:ciphertext:tag`（各段均为 base64）。
 */
export function encryptProviderApiKey(plain: string) {
  const key = getProviderSecretKey();
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${VERSION}:${encodeBase64(iv)}:${encodeBase64(ciphertext)}:${encodeBase64(tag)}`;
}

/**
 * 解密服务商 API Key 密文。
 */
export function decryptProviderApiKey(cipher: string) {
  const [version, ivBase64, ciphertextBase64, tagBase64] = cipher.split(":");
  if (version !== VERSION || ivBase64 == null || ciphertextBase64 == null || tagBase64 == null) {
    throw new Error("无效的 Provider API Key 密文格式");
  }

  const key = getProviderSecretKey();
  const iv = decodeBase64(ivBase64);
  const ciphertext = decodeBase64(ciphertextBase64);
  const tag = decodeBase64(tagBase64);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return plain.toString("utf8");
}

/**
 * 生成 API Key 脱敏展示值。
 */
export function maskProviderApiKey(plain: string) {
  if (plain.length <= 4)
    return "****";

  if (plain.length <= 8)
    return `${plain.slice(0, 2)}****`;

  return `${plain.slice(0, 3)}****${plain.slice(-4)}`;
}
