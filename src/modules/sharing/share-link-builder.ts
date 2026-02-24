/**
 * Builds share URLs with UTM tracking for weekly report viral sharing.
 * Supports Zalo, Facebook, and WhatsApp (fallback).
 */

const BASE_URL = "https://cungcontuhoc.vn";

export type SharePlatform = "zalo" | "facebook" | "whatsapp";

export type ShareLinkInput = {
  /** Parent's referral code — included as ref param */
  referralCode: string;
  /** Child's display name (first name only, no full name) */
  childFirstName: string;
  /** Number of lessons completed this week */
  lessonsThisWeek: number;
  /** Current streak in days */
  streakDays: number;
  /** UTM campaign to attribute the share to */
  utmCampaign?: string;
};

/** Returns the referral signup URL with UTM params for a given platform */
export function buildReferralUrl(
  referralCode: string,
  platform: SharePlatform,
  utmCampaign = "weekly_report"
) {
  if (!/^[A-Z0-9]{4,16}$/i.test(referralCode)) {
    throw new Error(`Invalid referral code format: ${referralCode}`);
  }
  const url = new URL(`${BASE_URL}/auth/signup`);
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", utmCampaign);
  return url.toString();
}

/** Pre-filled share message for each platform */
export function buildShareMessage(
  input: ShareLinkInput,
  platform: SharePlatform
) {
  const { referralCode, childFirstName, lessonsThisWeek, streakDays, utmCampaign } = input;
  const link = buildReferralUrl(referralCode, platform, utmCampaign);
  const name = childFirstName.trim().slice(0, 30);

  const stats =
    streakDays >= 7
      ? `${streakDays} ngày liên tiếp không nghỉ 🔥`
      : `${lessonsThisWeek} bài học tuần này`;

  const message = `Bé ${name} vừa hoàn thành ${stats} với Cùng Con Tự Học! Thử miễn phí 7 ngày (không cần thẻ): ${link}`;

  return message;
}

/** Returns the platform-specific share URL that opens the native share dialog */
export function buildPlatformShareUrl(
  input: ShareLinkInput,
  platform: SharePlatform
): string {
  const message = buildShareMessage(input, platform);
  const encodedMsg = encodeURIComponent(message);

  switch (platform) {
    case "zalo":
      // Zalo share link — opens Zalo app if installed, else web fallback
      return `https://zalo.me/share/?url=${encodeURIComponent(buildReferralUrl(input.referralCode, "zalo", input.utmCampaign))}&title=${encodedMsg}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildReferralUrl(input.referralCode, "facebook", input.utmCampaign))}&quote=${encodedMsg}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedMsg}`;
  }
}
