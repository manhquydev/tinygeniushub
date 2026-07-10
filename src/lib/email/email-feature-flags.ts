import { prisma } from "@/lib/db";

export type EmailFeatureFlagDefinition = {
  key: string;
  description: string;
  featureTags: string[];
};

export const EMAIL_FEATURE_FLAG_DEFINITIONS: EmailFeatureFlagDefinition[] = [
  {
    key: "EMAIL_WEEKLY_REPORT_ENABLED",
    description: "Enable/disable weekly report emails sent to parents.",
    featureTags: ["weekly_report"],
  },
  {
    key: "EMAIL_MARKETING_LIFECYCLE_ENABLED",
    description: "Enable/disable email reminders for learning and lifecycle care (D1/D3/D5/D7, winback, renewal).",
    featureTags: ["lifecycle"],
  },
  {
    key: "EMAIL_BLOG_COMMENT_NOTIFICATIONS_ENABLED",
    description: "Enable/disable comment verification emails and blog comment response notifications.",
    featureTags: ["blog_comment_verify", "blog_comment_reply"],
  },
  {
    key: "EMAIL_PARENT_VERIFICATION_ENABLED",
    description: "Enable/disable parent account verification email.",
    featureTags: ["parent_email_verify"],
  },
  {
    key: "EMAIL_PASSWORD_RESET_ENABLED",
    description: "Enable/disable password reset email.",
    featureTags: ["forgot_password"],
  },
  {
    key: "EMAIL_PAYMENT_NOTIFICATIONS_ENABLED",
    description: "Enable/disable learning package payment notification email (success/failure).",
    featureTags: ["package_subscription_success", "package_subscription_failed"],
  },
  {
    key: "EMAIL_CAREGIVER_INVITE_ENABLED",
    description: "Enable/disable caregiver invitation email.",
    featureTags: ["caregiver_invite"],
  },
  {
    key: "EMAIL_ADMIN_MANUAL_ENABLED",
    description: "Enable/disable manual emails sent from admin to parents.",
    featureTags: ["admin_manual_email"],
  },
  {
    key: "EMAIL_CONTACT_FORM_ENABLED",
    description: "Enable/disable contact form email (internal notification + confirmation response).",
    featureTags: ["contact_form", "contact_form_ack"],
  },
  {
    key: "EMAIL_WAITLIST_ENABLED",
    description: "Enable/disable email waitlist (internal notification + subscriber confirmation).",
    featureTags: ["waitlist_admin", "waitlist_confirmation"],
  },
];

const EMAIL_FEATURE_FLAG_KEY_BY_TAG = new Map<string, string>(
  EMAIL_FEATURE_FLAG_DEFINITIONS.flatMap((definition) =>
    definition.featureTags.map((featureTag) => [featureTag, definition.key] as const),
  ),
);

export function resolveEmailFeatureFlagKey(featureTag: string | null | undefined) {
  if (!featureTag) {
    return null;
  }

  return EMAIL_FEATURE_FLAG_KEY_BY_TAG.get(featureTag) ?? null;
}

export function isEmailFeatureFlagKey(key: string) {
  return key.startsWith("EMAIL_");
}

export async function isEmailFeatureEnabled(featureTag: string | null | undefined) {
  const flagKey = resolveEmailFeatureFlagKey(featureTag);
  if (!flagKey) {
    return true;
  }

  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: flagKey },
      select: { enabled: true },
    });
    if (!flag) {
      return true;
    }

    return flag.enabled;
  } catch {
    // Fail-open so transactional flow is not blocked if settings store is unavailable.
    return true;
  }
}
