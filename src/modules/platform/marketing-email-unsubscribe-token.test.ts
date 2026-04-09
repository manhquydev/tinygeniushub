import { describe, expect, it } from "vitest";
import {
  createMarketingEmailUnsubscribeToken,
  parseMarketingEmailUnsubscribeToken,
  verifyMarketingEmailUnsubscribeToken,
} from "@/modules/platform/marketing-email-unsubscribe-token";

describe("marketing email unsubscribe token", () => {
  it("creates and verifies a valid token", () => {
    const token = createMarketingEmailUnsubscribeToken({
      parentId: "parent-1",
      parentEmail: "Parent@Example.com",
    });

    const verifiedParentId = verifyMarketingEmailUnsubscribeToken({
      token,
      parentEmail: "parent@example.com",
    });

    expect(verifiedParentId).toBe("parent-1");
  });

  it("rejects invalid token format", () => {
    const parsed = parseMarketingEmailUnsubscribeToken("invalid-token");
    expect(parsed).toBeNull();
  });

  it("rejects token when email does not match", () => {
    const token = createMarketingEmailUnsubscribeToken({
      parentId: "parent-1",
      parentEmail: "parent@example.com",
    });

    const verifiedParentId = verifyMarketingEmailUnsubscribeToken({
      token,
      parentEmail: "another@example.com",
    });

    expect(verifiedParentId).toBeNull();
  });
});
