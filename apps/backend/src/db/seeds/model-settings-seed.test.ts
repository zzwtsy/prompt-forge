import { beforeEach, describe, expect, it, vi } from "vitest";

import { ensureModelSettingsSeed, modelSettingsSeedConstants } from "./model-settings-seed";

const mockState = vi.hoisted(() => ({
  providers: [] as Array<{ id: string; code: string; name: string; baseUrl: string; enabled: boolean }>,
  defaults: [] as Array<{ id: number; evaluateModelId: string | null; optimizeModelId: string | null }>,
}));

vi.mock("@/db", () => {
  return {
    default: {
      transaction: async (runner: (tx: any) => Promise<void>) => {
        const tx = {
          select: () => ({
            from: (table: any) => ({
              where: () => ({
                limit: async () => {
                  const tableName = table[Symbol.for("drizzle:Name")] as string;
                  if (tableName === "ai_providers")
                    return mockState.providers.slice(0, 1).map(item => ({ id: item.id }));

                  return mockState.defaults.slice(0, 1).map(item => ({ id: item.id }));
                },
              }),
            }),
          }),
          insert: (table: any) => ({
            values: async (payload: any) => {
              const tableName = table[Symbol.for("drizzle:Name")] as string;
              if (tableName === "ai_providers") {
                mockState.providers.push(payload);
                return;
              }

              mockState.defaults.push(payload);
            },
          }),
        };

        await runner(tx);
      },
    },
  };
});

describe("ensureModelSettingsSeed", () => {
  beforeEach(() => {
    mockState.providers = [];
    mockState.defaults = [];
  });

  it("is idempotent and only inserts one openai provider/default row", async () => {
    await ensureModelSettingsSeed();
    await ensureModelSettingsSeed();

    expect(mockState.providers).toHaveLength(1);
    expect(mockState.providers[0]?.code).toBe(modelSettingsSeedConstants.OPENAI_PROVIDER_CODE);
    expect(mockState.providers[0]?.name).toBe(modelSettingsSeedConstants.OPENAI_PROVIDER_NAME);
    expect(mockState.providers[0]?.baseUrl).toBe(modelSettingsSeedConstants.OPENAI_PROVIDER_BASE_URL);
    expect(mockState.providers[0]?.enabled).toBe(false);

    expect(mockState.defaults).toHaveLength(1);
    expect(mockState.defaults[0]?.id).toBe(modelSettingsSeedConstants.DEFAULTS_SINGLETON_ID);
    expect(mockState.defaults[0]?.evaluateModelId).toBeNull();
    expect(mockState.defaults[0]?.optimizeModelId).toBeNull();
  });
});
