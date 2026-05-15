/**
 * Builds share URLs with UTM tracking for weekly report viral sharing.
 * Supports Zalo, Facebook, and WhatsApp (fallback).
 */

const BASE_URL = "https://www.tinygeniushubvn.tech";

export type SharePlatform = "zalo" | "facebook" | "whatsapp";

export type ShareLinkInput = {
  referralCode: string;
  childFirstName: string;
  lessonsThisWeek: number;
  streakDays: number;
  utmCampaign?: string;
};

export function buildReferralUrl(referralCode: string, platform: SharePlatform, utmCampaign = "weekly_report") {
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

export function buildShareMessage(input: ShareLinkInput, platform: SharePlatform) {
  const { referralCode, childFirstName, lessonsThisWeek, streakDays, utmCampaign } = input;
  const link = buildReferralUrl(referralCode, platform, utmCampaign);
  const name = childFirstName.trim().slice(0, 30);

  const stats =
    streakDays >= 7
      ? `${streakDays} consecutive days`
      : `${lessonsThisWeek} ${lessonsThisWeek === 1 ? "lesson" : "lessons"} this week`;

  return `Little ${name} just completed ${stats} with TinyGenius Hub. View the course and buy directly via bank transfer/QR: ${link}`;
}

export function buildPlatformShareUrl(input: ShareLinkInput, platform: SharePlatform): string {
  const message = buildShareMessage(input, platform);
  const encodedMsg = encodeURIComponent(message);

  switch (platform) {
    case "zalo":
      return `https://zalo.me/share/?url=${encodeURIComponent(buildReferralUrl(input.referralCode, "zalo", input.utmCampaign))}&title=${encodedMsg}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildReferralUrl(input.referralCode, "facebook", input.utmCampaign))}&quote=${encodedMsg}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedMsg}`;
  }
}
