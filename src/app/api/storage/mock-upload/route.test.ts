import { beforeEach, describe, expect, it } from "vitest";
import { env } from "@/lib/env";
import { PUT } from "@/app/api/storage/mock-upload/route";

describe("storage mock upload route", () => {
  beforeEach(() => {
    env.NODE_ENV = "test";
    env.STORAGE_PROVIDER = "mock_r2";
  });

  it("returns 404 in production", async () => {
    env.NODE_ENV = "production";

    const response = await PUT(new Request("http://localhost/api/storage/mock-upload", { method: "PUT" }));
    expect(response.status).toBe(404);
  });

  it("returns 404 when active storage provider is not mock_r2", async () => {
    env.STORAGE_PROVIDER = "cloudflare_r2";

    const response = await PUT(new Request("http://localhost/api/storage/mock-upload", { method: "PUT" }));
    expect(response.status).toBe(404);
  });
});
