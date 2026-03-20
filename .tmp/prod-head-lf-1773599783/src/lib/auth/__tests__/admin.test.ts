import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/auth/admin";

describe("isAdminEmail", () => {
  it("matches email in case-insensitive mode", () => {
    expect(isAdminEmail("Admin@Example.com", ["admin@example.com"])).toBe(true);
  });

  it("returns false when email is not in admin list", () => {
    expect(isAdminEmail("parent@example.com", ["admin@example.com"])).toBe(false);
  });
});
