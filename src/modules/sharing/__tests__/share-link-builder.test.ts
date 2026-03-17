import { describe, expect, it } from "vitest";
import { buildPlatformShareUrl, buildReferralUrl, buildShareMessage } from "../share-link-builder";

const BASE_INPUT = {
  referralCode: "ABC12345",
  childFirstName: "An",
  lessonsThisWeek: 5,
  streakDays: 3,
};

describe("buildReferralUrl", () => {
  it("includes ref, utm_source, utm_medium, utm_campaign", () => {
    const url = buildReferralUrl("ABC12345", "facebook");
    expect(url).toContain("ref=ABC12345");
    expect(url).toContain("utm_source=facebook");
    expect(url).toContain("utm_medium=share");
    expect(url).toContain("utm_campaign=weekly_report");
  });

  it("throws on invalid referral code format", () => {
    expect(() => buildReferralUrl("../../etc", "zalo")).toThrow("Invalid referral code format");
    expect(() => buildReferralUrl("", "zalo")).toThrow();
    expect(() => buildReferralUrl("AB!@#$", "zalo")).toThrow();
  });

  it("accepts custom utmCampaign", () => {
    const url = buildReferralUrl("CODE", "zalo", "badge_share");
    expect(url).toContain("utm_campaign=badge_share");
  });
});

describe("buildShareMessage", () => {
  it("includes child name and referral link", () => {
    const msg = buildShareMessage(BASE_INPUT, "facebook");
    expect(msg).toContain("An");
    expect(msg).toContain("cungcontuhoc.io.vn");
    expect(msg).toContain("ABC12345");
  });

  it("highlights streak when >= 7 days", () => {
    const msg = buildShareMessage({ ...BASE_INPUT, streakDays: 7 }, "zalo");
    expect(msg).toContain("7 ngày liên tiếp");
  });

  it("shows lessons when streak < 7 days", () => {
    const msg = buildShareMessage(BASE_INPUT, "whatsapp");
    expect(msg).toContain("5 bài học");
  });

  it("trims and caps long child names at 30 chars", () => {
    const longName = "A".repeat(50);
    const msg = buildShareMessage({ ...BASE_INPUT, childFirstName: longName }, "facebook");
    expect(msg).toContain("A".repeat(30));
    expect(msg).not.toContain("A".repeat(31));
  });
});

describe("buildPlatformShareUrl", () => {
  it("zalo URL uses zalo.me domain", () => {
    const url = buildPlatformShareUrl(BASE_INPUT, "zalo");
    expect(url).toContain("zalo.me");
  });

  it("facebook URL uses facebook.com/sharer", () => {
    const url = buildPlatformShareUrl(BASE_INPUT, "facebook");
    expect(url).toContain("facebook.com/sharer");
  });

  it("whatsapp URL uses wa.me", () => {
    const url = buildPlatformShareUrl(BASE_INPUT, "whatsapp");
    expect(url).toContain("wa.me");
  });

  it("all platforms encode referral code in link", () => {
    for (const platform of ["zalo", "facebook", "whatsapp"] as const) {
      const url = buildPlatformShareUrl(BASE_INPUT, platform);
      expect(url).toContain("ABC12345");
    }
  });
});
