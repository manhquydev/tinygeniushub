import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

describe("sanitizeNextPath", () => {
  it("accepts local application paths", () => {
    expect(sanitizeNextPath("/courses/abeka?from=checkout")).toBe(
      "/courses/abeka?from=checkout",
    );
  });

  it("rejects empty and malformed values", () => {
    expect(sanitizeNextPath("")).toBeNull();
    expect(sanitizeNextPath("   ")).toBeNull();
    expect(sanitizeNextPath("https://evil.example")).toBeNull();
    expect(sanitizeNextPath("//evil.example")).toBeNull();
    expect(sanitizeNextPath("/\\evil")).toBeNull();
  });

  it("rejects loop-prone auth/session pages", () => {
    expect(sanitizeNextPath("/session-expired")).toBeNull();
    expect(sanitizeNextPath("/auth/login")).toBeNull();
    expect(sanitizeNextPath("/auth/signup")).toBeNull();
  });
});

