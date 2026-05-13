import { LifecycleEmailType } from "@prisma/client";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";

type BuildLifecycleEmailInput = {
  displayName: string | null;
  renewalEndDate?: Date | null;
};

type LifecycleEmailContent = {
  subject: string;
  text: string;
};

function lifecycleLink(path: string, campaign: string) {
  return `${resolveEmailPublicBaseUrl()}${path}?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
}

function formatDateVi(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parentName(displayName: string | null) {
  return displayName?.trim() || "you";
}

function buildTrialWelcomeEmail(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "trial_d0");
  return {
    subject: "Welcome to TinyGenius Hub - get started in 2 minutes",
    text: [
      `Hello${name},`,
      "",
      "Thank you for signing up for TinyGenius Hub.",
      "Your child is about to start the Mental Math + English Phonics program with a learning rhythm of 15 minutes/day.",
      "",
      "Get started now:",
      dashboardUrl,
      "",
      "No credit card required · Free 7-day trial.",
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildTrialD1Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "trial_d1_activation");
  return {
    subject: "Gentle reminder on day 1 - help your child complete the first lesson today",
    text: [
      `Hello${name},`,
      "",
      "The first day is an important milestone for your baby to get into the learning routine.",
      "It only takes 15 minutes to complete the first lesson and set momentum for the whole week.",
      "",
      `Open dashboard:${dashboardUrl}`,
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildTrialD3Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const reportUrl = lifecycleLink("/parent/reports", "trial_d3_progress");
  return {
    subject: "Baby's first 3 days mini report — how is it progressing? 📊",
    text: [
      `Hello${name},`,
      "",
      "Baby has been walking for the first 3 days of the trial.",
      "This is an important milestone to maintain a study rhythm and build a consistent daily routine.",
      "",
      `View reports and current progress:${reportUrl}`,
      "",
      "There are 4 days of trial left to clearly verify its suitability for families.",
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildTrialD5Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const referralUrl = lifecycleLink("/auth/signup", "trial_d5_referral");
  return {
    subject: "Day 5 trial - share with other parents to receive more incentives",
    text: [
      `Hello${name},`,
      "",
      "If your family finds your child's learning journey suitable, you can recommend it to other parents.",
      "Each successful referral will help both families receive additional incentives according to the current referral program.",
      "",
      `Share here:${referralUrl}`,
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildTrialD7Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const pricingUrl = lifecycleLink("/pricing", "trial_d7_convert");
  return {
    subject: "Trial is about to end — keep your child's learning path today",
    text: [
      `Hello${name},`,
      "",
      "Today is the last day of the 7-day free trial.",
      "If your child has started to learn, this is the time to keep the schedule uninterrupted.",
      "",
      "Current year plan:",
      "• Standard: 799,000 VND/year",
      "• Family+: 1,199,000 VND/year",
      "",
      `Choose the right package:${pricingUrl}`,
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildWinbackD30Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "winback_d30");
  return {
    subject: "Baby misses you - come back to study for 15 minutes today",
    text: [
      `Hello${name},`,
      "",
      "It's been a while since the family has returned to their studies.",
      "Just 15 minutes today to restart your baby's learning habits.",
      "",
      `Return to dashboard:${dashboardUrl}`,
      "",
      "If you need support, just respond to this email.",
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

function buildRenewal14dEmail(displayName: string | null, renewalEndDate?: Date | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const pricingUrl = lifecycleLink("/pricing", "renewal_14d");
  const renewalDateLine = renewalEndDate
    ? `The current package will expire on${formatDateVi(renewalEndDate)}.`
    : "Your current plan is due for renewal.";

  return {
    subject: "Remind to renew the study package 14 days in advance so as not to interrupt the route",
    text: [
      `Hello${name},`,
      "",
      renewalDateLine,
      "Renewing early helps keep your child's learning rhythm continuous.",
      "",
      `Renew here:${pricingUrl}`,
      "",
      "Close,",
      "TinyGenius Hub Team",
    ].join("\n"),
  };
}

export function buildLifecycleEmailContent(
  type: LifecycleEmailType,
  input: BuildLifecycleEmailInput,
): LifecycleEmailContent {
  if (type === LifecycleEmailType.TRIAL_WELCOME) return buildTrialWelcomeEmail(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D1) return buildTrialD1Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D3) return buildTrialD3Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D5) return buildTrialD5Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D7) return buildTrialD7Email(input.displayName);
  if (type === LifecycleEmailType.WINBACK_D30) return buildWinbackD30Email(input.displayName);
  return buildRenewal14dEmail(input.displayName, input.renewalEndDate);
}

