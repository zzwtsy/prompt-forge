import { describe, expect, it } from "vitest";

import { decryptProviderApiKey, encryptProviderApiKey, maskProviderApiKey } from "./provider-key-crypto";

describe("provider-key-crypto", () => {
  it("supports encrypt/decrypt round-trip", () => {
    const plain = "sk-test-key-1234567890";
    const cipher = encryptProviderApiKey(plain);
    const decoded = decryptProviderApiKey(cipher);

    expect(decoded).toBe(plain);
  });

  it("throws when ciphertext is tampered", () => {
    const plain = "sk-test-key-1234567890";
    const cipher = encryptProviderApiKey(plain);
    const parts = cipher.split(":");
    parts[3] = "AAAAAAAAAAAAAAAAAAAAAA==";

    expect(() => decryptProviderApiKey(parts.join(":"))).toThrow();
  });

  it("masks provider api keys", () => {
    expect(maskProviderApiKey("sk-1234567890")).toMatch(/^sk-\*{4}\d{4}$/);
    expect(maskProviderApiKey("abcd")).toBe("****");
  });
});
