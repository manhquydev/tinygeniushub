import { env } from "@/lib/env";

type TemplateTag = {
  name: string;
  value: string;
};

type RenderProjectEmailHtmlInput = {
  subject: string;
  text: string;
  tags?: TemplateTag[];
};

const FEATURE_TITLES: Record<string, string> = {
  weekly_report: "Báo cáo tuần của bé đã sẵn sàng",
  lifecycle: "Thông báo từ lộ trình học của bé",
  caregiver_invite: "Lời mời caregiver từ Cùng Con Tự Học",
  contact_form: "Yêu cầu liên hệ mới",
  contact_form_ack: "Chúng tôi đã nhận yêu cầu hỗ trợ của bạn",
  waitlist_confirmation: "Xác nhận đăng ký danh sách chờ",
  waitlist_admin: "Thông báo đăng ký waitlist mới",
  blog_newsletter_verify: "Xác nhận đăng ký bản tin",
  blog_newsletter_weekly: "Bản tin blog tuần này",
  blog_comment_verify: "Xác nhận bình luận",
  blog_comment_reply: "Có phản hồi mới cho bình luận của bạn",
  admin_manual_email: "Thông báo từ bộ phận hỗ trợ",
  forgot_password: "Đặt lại mật khẩu tài khoản",
  package_subscription_success: "Thanh toán gói học thành công",
  package_subscription_failed: "Thanh toán gói học chưa thành công",
};

const CANONICAL_APP_BASE_URL = "https://cungcontuhoc.io.vn";
const CANONICAL_SUPPORT_EMAIL = "support@cungcontuhoc.io.vn";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function findFeature(tags?: TemplateTag[]) {
  return tags?.find((tag) => tag.name === "feature")?.value ?? "default";
}

function findPrimaryUrl(text: string) {
  const matches = text.match(/https?:\/\/[^\s)]+/g);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches[0];
}

function lineToHtml(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return "";
  }

  const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/g) ?? [];
  let html = escapeHtml(trimmed);

  for (const url of urlMatches) {
    const escapedUrl = escapeHtml(url);
    html = html.replace(
      escapedUrl,
      `<a href="${escapedUrl}" style="color:#0b5fff;text-decoration:underline;word-break:break-all;">${escapedUrl}</a>`,
    );
  }

  return html;
}

function textToHtmlBody(text: string) {
  const blocks = text
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        return "";
      }

      const unorderedPattern = /^(-|•)\s+/;
      const orderedPattern = /^\d+[.)]\s+/;
      const checkboxPattern = /^-\s+\[(?: |x|X)\]\s+/;

      const isUnorderedList = lines.every(
        (line) => unorderedPattern.test(line) || checkboxPattern.test(line),
      );
      const isOrderedList = lines.every((line) => orderedPattern.test(line));

      if (isUnorderedList || isOrderedList) {
        const items = lines
          .map((line) => {
            if (checkboxPattern.test(line)) {
              const checked = /^-\s+\[(?:x|X)\]\s+/.test(line);
              const content = line.replace(checkboxPattern, "").trim();
              return `${checked ? "☑" : "☐"} ${content}`.trim();
            }

            if (orderedPattern.test(line)) {
              return line.replace(orderedPattern, "").trim();
            }

            return line.replace(unorderedPattern, "").trim();
          })
          .filter((line) => line.length > 0)
          .map(
            (line) => `<li style="margin:0 0 8px;line-height:1.55;color:#1f2937;font-size:15px;">${lineToHtml(line)}</li>`,
          )
          .join("");

        const listTag = isOrderedList ? "ol" : "ul";
        return `<${listTag} style="margin:0 0 16px 20px;padding:0;">${items}</${listTag}>`;
      }

      const content = lines.map((line) => lineToHtml(line)).join("<br/>");
      return `<p style="margin:0 0 14px;line-height:1.65;color:#1f2937;font-size:15px;">${content}</p>`;
    })
    .join("");
}

export function resolveEmailPublicBaseUrl(rawBaseUrl?: string) {
  const candidateBaseUrl =
    typeof rawBaseUrl === "string" && rawBaseUrl.length > 0
      ? rawBaseUrl
      : typeof env.BETTER_AUTH_URL === "string" && env.BETTER_AUTH_URL.length > 0
        ? env.BETTER_AUTH_URL
        : CANONICAL_APP_BASE_URL;

  try {
    const parsed = new URL(candidateBaseUrl);
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
      return CANONICAL_APP_BASE_URL;
    }

    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return CANONICAL_APP_BASE_URL;
  }
}

function resolveSupportEmail() {
  return env.REPORT_EMAIL_REPLY_TO ?? CANONICAL_SUPPORT_EMAIL;
}

function resolveCtaLabel(feature: string) {
  if (feature === "forgot_password") {
    return "Đặt lại mật khẩu";
  }

  return "Xem chi tiết";
}

export function renderProjectEmailHtml(input: RenderProjectEmailHtmlInput) {
  const feature = findFeature(input.tags);
  const title = FEATURE_TITLES[feature] ?? input.subject;
  const bodyHtml = textToHtmlBody(input.text);
  const primaryUrl = findPrimaryUrl(input.text);

  const appBaseUrl = resolveEmailPublicBaseUrl();
  const logoUrl = `${appBaseUrl}/logo-cungcontuhoc-mascot-email.png`;

  const supportEmail = resolveSupportEmail();
  const supportEmailHref = `mailto:${supportEmail}`;
  const year = new Date().getUTCFullYear();
  const ctaLabel = resolveCtaLabel(feature);

  return [
    "<!doctype html>",
    '<html lang="vi">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(input.subject)}</title>`,
    "</head>",
    '<body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">',
    `  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(title)} - Cùng Con Tự Học</div>`,
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#eef3fb;">',
    "  <tr>",
    '    <td align="center">',
    '      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #dbe5f3;overflow:hidden;">',
    "        <tr>",
    '          <td style="padding:28px 28px 22px;background:linear-gradient(135deg,#0b3f91 0%,#0b5fff 55%,#22c1ee 100%);">',
    `            <img src="${escapeHtml(logoUrl)}" alt="Cùng Con Tự Học" style="display:block;height:72px;width:72px;max-width:100%;border-radius:16px;background:rgba(255,255,255,0.16);padding:4px;" />`,
    '            <p style="margin:12px 0 0;color:#dbeafe;font-size:13px;line-height:1.5;">Nền tảng đồng hành cùng phụ huynh xây thói quen học tập mỗi ngày</p>',
    `            <h1 style="margin:14px 0 0;color:#ffffff;font-size:24px;line-height:1.35;font-weight:700;">${escapeHtml(title)}</h1>`,
    "          </td>",
    "        </tr>",
    '        <tr><td style="padding:24px 28px 8px;">',
    `          ${bodyHtml}`,
    "        </td></tr>",
    primaryUrl
      ? `        <tr><td style="padding:0 28px 22px;"><a href="${escapeHtml(primaryUrl)}" style="display:inline-block;background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">${ctaLabel}</a></td></tr>`
      : "",
    '        <tr><td style="padding:0 28px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>',
    "        <tr>",
    '          <td style="padding:16px 28px 26px;color:#64748b;font-size:12px;line-height:1.7;">',
    '            Nếu cần hỗ trợ, vui lòng phản hồi email này hoặc liên hệ:',
    `            <a href="${escapeHtml(supportEmailHref)}" style="color:#0b5fff;text-decoration:none;font-weight:600;">${escapeHtml(supportEmail)}</a><br/>`,
    `            © ${year} Cùng Con Tự Học · ${escapeHtml(CANONICAL_APP_BASE_URL)}`,
    "          </td>",
    "        </tr>",
    "      </table>",
    "    </td>",
    "  </tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("");
}
