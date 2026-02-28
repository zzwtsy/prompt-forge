import { describe, expect, it, vi } from "vitest";

import { createTestApp } from "@/lib/app/create-app";
import { AppErrorCode } from "@/lib/errors/codes";

import router from "./model-settings.index";

vi.mock("@/db", () => ({
  default: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

async function parseBody(response: Response) {
  return await response.json() as {
    success: boolean;
    error?: {
      code: number;
      message: string;
    };
  };
}

describe("model-settings routes", () => {
  it("rejects anonymous provider listing requests", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/providers");
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.UNAUTHORIZED.code);
  });

  it("rejects anonymous model sync requests", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/providers/p1/models/sync", {
      method: "POST",
    });
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(AppErrorCode.UNAUTHORIZED.code);
  });
});
