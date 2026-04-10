import { prisma } from "@/lib/db";

export type EmailFeatureFlagDefinition = {
  key: string;
  description: string;
  featureTags: string[];
};

export const EMAIL_FEATURE_FLAG_DEFINITIONS: EmailFeatureFlagDefinition[] = [
  {
    key: "EMAIL_WEEKLY_REPORT_ENABLED",
    description: "Bật/tắt email báo cáo tuần gửi cho phụ huynh.",
    featureTags: ["weekly_report"],
  },
  {
    key: "EMAIL_MARKETING_LIFECYCLE_ENABLED",
    description: "Bật/tắt email nhắc học và chăm sóc vòng đời (D1/D3/D5/D7, winback, renewal).",
    featureTags: ["lifecycle"],
  },
  {
    key: "EMAIL_MARKETING_BLOG_NEWSLETTER_ENABLED",
    description: "Bật/tắt email newsletter blog (xác nhận đăng ký + bản tin tuần).",
    featureTags: ["blog_newsletter_verify", "blog_newsletter_weekly"],
  },
  {
    key: "EMAIL_BLOG_COMMENT_NOTIFICATIONS_ENABLED",
    description: "Bật/tắt email xác minh bình luận và thông báo phản hồi bình luận blog.",
    featureTags: ["blog_comment_verify", "blog_comment_reply"],
  },
  {
    key: "EMAIL_PARENT_VERIFICATION_ENABLED",
    description: "Bật/tắt email xác minh tài khoản phụ huynh.",
    featureTags: ["parent_email_verify"],
  },
  {
    key: "EMAIL_PASSWORD_RESET_ENABLED",
    description: "Bật/tắt email đặt lại mật khẩu.",
    featureTags: ["forgot_password"],
  },
  {
    key: "EMAIL_PAYMENT_NOTIFICATIONS_ENABLED",
    description: "Bật/tắt email thông báo thanh toán gói học (thành công/thất bại).",
    featureTags: ["package_subscription_success", "package_subscription_failed"],
  },
  {
    key: "EMAIL_CAREGIVER_INVITE_ENABLED",
    description: "Bật/tắt email mời caregiver.",
    featureTags: ["caregiver_invite"],
  },
  {
    key: "EMAIL_ADMIN_MANUAL_ENABLED",
    description: "Bật/tắt email thủ công gửi từ admin cho phụ huynh.",
    featureTags: ["admin_manual_email"],
  },
  {
    key: "EMAIL_CONTACT_FORM_ENABLED",
    description: "Bật/tắt email form liên hệ (thông báo nội bộ + phản hồi xác nhận).",
    featureTags: ["contact_form", "contact_form_ack"],
  },
  {
    key: "EMAIL_WAITLIST_ENABLED",
    description: "Bật/tắt email waitlist (thông báo nội bộ + xác nhận người đăng ký).",
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
