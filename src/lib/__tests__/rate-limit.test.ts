import { describe, expect, it } from "vitest";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

describe("enforceRateLimit", () => {
  it("blocks after reaching limit in the same window", async () => {
    const key = `test:${Date.now()}`;
    const first = await enforceRateLimit({ key, limit: 2, windowMs: 1_000 });
    const second = await enforceRateLimit({ key, limit: 2, windowMs: 1_000 });
    const third = await enforceRateLimit({ key, limit: 2, windowMs: 1_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(typeof third.retryAfterMs).toBe("number");
  });

  it("supports fail-closed mode when distributed store is unavailable", async () => {
    const result = await enforceRateLimit({
      key: `test-deny:${Date.now()}`,
      limit: 10,
      windowMs: 1_000,
      storeFailureMode: "deny",
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("store_unavailable");
  });
});

describe("getRequestIp", () => {
  it("uses forwarded chain when proxy is trusted", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.8, 10.1.0.5",
      },
    });

    const ip = getRequestIp(request, {
      trustProxy: true,
      trustedProxyHops: 1,
    });
    expect(ip).toBe("203.0.113.8");
  });

  it("returns unknown when proxy trust is disabled", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.8, 10.1.0.5",
        "x-real-ip": "198.51.100.20",
      },
    });

    const ip = getRequestIp(request, {
      trustProxy: false,
    });
    expect(ip).toBe("unknown");
  });

  it("supports trusted proxy hops > 1", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "198.51.100.10, 10.0.0.2, 10.0.0.3",
      },
    });

    const ip = getRequestIp(request, {
      trustProxy: true,
      trustedProxyHops: 2,
    });
    expect(ip).toBe("198.51.100.10");
  });

  it("ignores invalid forwarded ip and falls back to real ip", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "unknown, bad-value",
        "x-real-ip": "198.51.100.42",
      },
    });

    const ip = getRequestIp(request, {
      trustProxy: true,
      trustedProxyHops: 1,
    });
    expect(ip).toBe("198.51.100.42");
  });
});
