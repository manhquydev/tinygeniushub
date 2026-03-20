import { describe, expect, it } from "vitest";
import { fail } from "@/lib/http";

describe("http fail", () => {
  it("sets Retry-After header for 429 responses", async () => {
    const response = fail("Too many requests", 429, { retryAfterMs: 1500 });
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2");
    expect(json).toEqual({
      ok: false,
      error: {
        message: "Too many requests",
        details: {
          retryAfterMs: 1500,
        },
      },
    });
  });

  it("does not set Retry-After when not rate limited", () => {
    const response = fail("Bad request", 400, { code: "bad_input" });

    expect(response.status).toBe(400);
    expect(response.headers.get("Retry-After")).toBeNull();
  });

  it("does not set Retry-After when details are invalid", () => {
    const response = fail("Too many requests", 429, { retryAfterMs: "later" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeNull();
  });
});
