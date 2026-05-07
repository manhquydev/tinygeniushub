import { describe, expect, it } from "vitest";
import { assertTrustedOrigin } from "@/lib/security/csrf";

function expectCsrfError(fn: () => void, expectedCode: string) {
  try {
    fn();
    throw new Error("Expected function to throw DomainError");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as { code?: string }).code).toBe(expectedCode);
    expect((error as { status?: number }).status).toBe(403);
  }
}

describe("assertTrustedOrigin", () => {
  it("allows safe methods without origin headers", () => {
    const request = new Request("http://localhost/api/reports/generate", {
      method: "GET",
    });

    expect(() => assertTrustedOrigin(request)).not.toThrow();
  });

  it("allows matching origin and host", () => {
    const request = new Request("http://localhost/api/reports/generate", {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://localhost",
      },
    });

    expect(() => assertTrustedOrigin(request)).not.toThrow();
  });

  it("allows referer fallback when origin header is missing", () => {
    const request = new Request("https://tinygeniushubvn.tech/api/reports/generate", {
      method: "POST",
      headers: {
        host: "tinygeniushubvn.tech",
        referer: "https://tinygeniushubvn.tech/parent/dashboard",
      },
    });

    expect(() => assertTrustedOrigin(request)).not.toThrow();
  });

  it("supports forwarded host and protocol", () => {
    const request = new Request("http://internal/api/reports/generate", {
      method: "POST",
      headers: {
        "x-forwarded-host": "app.example.com",
        "x-forwarded-proto": "https",
        origin: "https://app.example.com",
      },
    });

    expect(() => assertTrustedOrigin(request)).not.toThrow();
  });

  it("rejects cross-site fetch metadata requests", () => {
    const request = new Request("https://tinygeniushubvn.tech/api/reports/generate", {
      method: "POST",
      headers: {
        host: "tinygeniushubvn.tech",
        origin: "https://tinygeniushubvn.tech",
        "sec-fetch-site": "cross-site",
      },
    });

    expectCsrfError(() => assertTrustedOrigin(request), "CSRF_FETCH_METADATA_BLOCKED");
  });

  it("rejects when origin and referer are both missing", () => {
    const request = new Request("http://localhost/api/reports/generate", {
      method: "POST",
      headers: {
        host: "localhost",
      },
    });

    expectCsrfError(() => assertTrustedOrigin(request), "CSRF_ORIGIN_MISSING");
  });

  it("rejects origin mismatch", () => {
    const request = new Request("https://tinygeniushubvn.tech/api/reports/generate", {
      method: "POST",
      headers: {
        host: "tinygeniushubvn.tech",
        origin: "https://attacker.example",
      },
    });

    expectCsrfError(() => assertTrustedOrigin(request), "CSRF_ORIGIN_MISMATCH");
  });
});
