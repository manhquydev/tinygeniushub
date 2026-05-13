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

type ExtractedLink = {
  url: string;
  label: string | null;
  isUnsubscribe: boolean;
};

const FEATURE_TITLES: Record<string, string> = {
  weekly_report: "Your baby's weekly report is ready",
  lifecycle: "Notice from your child's learning path",
  caregiver_invite: "Caregiver invitation from TinyGenius Hub",
  contact_form: "New contact request",
  contact_form_ack: "We have received your support request",
  waitlist_confirmation: "Waitlist registration confirmation",
  waitlist_admin: "Notice of new waitlist registration",
  blog_newsletter_verify: "Confirm newsletter subscription",
  blog_newsletter_weekly: "Blog news this week",
  blog_comment_verify: "Confirmed comment",
  blog_comment_reply: "There is a new response to your comment",
  admin_manual_email: "Notification from support",
  forgot_password: "Reset account password",
  parent_email_verify: "Verify account email",
  package_subscription_success: "Successfully paid for the learning package",
  package_subscription_failed: "Payment for the learning package has not been successful",
};

const CANONICAL_APP_BASE_URL = "https://www.tinygeniushubvn.tech";
const CANONICAL_SUPPORT_EMAIL = "support@tinygeniushubvn.tech";
const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif";
const unsubscribeCopyPattern =
  /unsubscribe|stop receiving|stop emails|opt out|remove me|cancel subscription|newsletter/i;

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

function normalizeUrlForDisplay(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch {
    return "Open the link";
  }
}

function extractLinks(text: string): ExtractedLink[] {
  const lines = text.split(/\r?\n/);
  const links: ExtractedLink[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const labeledMatch = trimmed.match(/^(.+?)\s*:\s*(https?:\/\/[^\s)]+)\s*$/i);
    if (labeledMatch) {
      const label = labeledMatch[1]?.trim();
      const url = labeledMatch[2]?.trim();
      if (label && url) {
        links.push({
          url,
          label,
          isUnsubscribe: unsubscribeCopyPattern.test(trimmed) || /\/unsubscribe\b/i.test(url),
        });
        continue;
      }
    }

    const matches = trimmed.match(/https?:\/\/[^\s)]+/g);
    if (!matches || matches.length === 0) {
      continue;
    }

    for (const match of matches) {
      links.push({
        url: match,
        label: null,
        isUnsubscribe: unsubscribeCopyPattern.test(trimmed) || /\/unsubscribe\b/i.test(match),
      });
    }
  }

  return links;
}

function findPrimaryActionLink(text: string) {
  const links = extractLinks(text);
  const primary = links.find((link) => !link.isUnsubscribe);
  if (!primary) {
    return null;
  }

  return {
    url: primary.url,
    label: primary.label,
  };
}

function findUnsubscribeUrl(text: string) {
  const links = extractLinks(text);
  return links.find((link) => link.isUnsubscribe)?.url ?? null;
}

function stripUnsubscribeCopy(text: string, unsubscribeUrl: string | null) {
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return true;
    }

    if (unsubscribeUrl && trimmed.includes(unsubscribeUrl)) {
      return false;
    }

    if (unsubscribeCopyPattern.test(trimmed)) {
      return false;
    }

    return true;
  });

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function resolvePreheader(title: string, text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^https?:\/\/[^\s)]+$/i.test(line));

  if (lines.length === 0) {
    return `${title} - TinyGenius Hub`;
  }

  return `${lines[0].slice(0, 120)}${lines[0].length > 120 ? "..." : ""}`;
}

function lineToHtml(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return "";
  }

  const labeledMatch = trimmed.match(/^(.+?)\s*:\s*(https?:\/\/[^\s)]+)\s*$/i);
  if (labeledMatch) {
    const label = labeledMatch[1]?.trim();
    const url = labeledMatch[2]?.trim();
    if (label && url) {
      const escapedUrl = escapeHtml(url);
      return `<a href="${escapedUrl}" style="color:#0b5fff;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`;
    }
  }

  if (/^https?:\/\/[^\s)]+$/i.test(trimmed)) {
    const escapedUrl = escapeHtml(trimmed);
    const linkLabel = escapeHtml(normalizeUrlForDisplay(trimmed));
    return `<a href="${escapedUrl}" style="color:#0b5fff;text-decoration:none;font-weight:600;">${linkLabel}</a>`;
  }

  const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/g) ?? [];
  let html = escapeHtml(trimmed);

  for (const url of urlMatches) {
    const escapedUrl = escapeHtml(url);
    const linkLabel = escapeHtml(normalizeUrlForDisplay(url));
    html = html.replace(
      escapedUrl,
      `<a href="${escapedUrl}" style="color:#0b5fff;text-decoration:none;font-weight:600;">${linkLabel}</a>`,
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

      const unorderedPattern = /^(-|\u2022)\s+/;
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
              return `${checked ? "\u2611" : "\u2610"} ${content}`.trim();
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
    return "Reset password";
  }

  if (feature === "parent_email_verify") {
    return "Verify email";
  }

  if (feature === "blog_comment_verify") {
    return "Confirmed comment";
  }

  if (feature === "blog_newsletter_verify") {
    return "Confirm registration";
  }

  if (feature === "blog_comment_reply") {
    return "See response";
  }

  if (feature === "lifecycle") {
    return "Open the control panel";
  }

  return "See details";
}

export function renderProjectEmailHtml(input: RenderProjectEmailHtmlInput) {
  const feature = findFeature(input.tags);
  const title = FEATURE_TITLES[feature] ?? input.subject;
  const unsubscribeUrl = findUnsubscribeUrl(input.text);
  const normalizedText = stripUnsubscribeCopy(input.text, unsubscribeUrl);
  const bodyHtml = textToHtmlBody(normalizedText);
  const primaryAction = findPrimaryActionLink(normalizedText);
  const preheader = resolvePreheader(title, normalizedText);

  const appBaseUrl = resolveEmailPublicBaseUrl();
  const logoUrl = `${appBaseUrl}/logo-tinygeniushub-mascot-email.png`;

  const supportEmail = resolveSupportEmail();
  const supportEmailHref = `mailto:${supportEmail}`;
  const year = new Date().getUTCFullYear();
  const defaultCtaLabel = resolveCtaLabel(feature);
  const ctaLabel = defaultCtaLabel === "See details"
    ? (primaryAction?.label ?? defaultCtaLabel)
    : defaultCtaLabel;

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '  <meta name="color-scheme" content="light" />',
    '  <meta name="supported-color-schemes" content="light" />',
    `  <title>${escapeHtml(input.subject)}</title>`,
    "  <style>",
    "    :root { color-scheme: light only; supported-color-schemes: light; }",
    "    @media (prefers-color-scheme: dark) {",
    "      body.email-bg, table.email-shell { background:#eef3fb !important; }",
    "      table.email-card { background:#ffffff !important; border-color:#dbe5f3 !important; }",
    "      td.email-body p, td.email-body li, td.email-fallback, td.email-footer { color:#1f2937 !important; }",
    "      td.email-body a, td.email-fallback a, td.email-footer a { color:#0b5fff !important; }",
    "    }",
    "  </style>",
    "</head>",
    `<body class="email-bg" style="margin:0;padding:0;background:#eef3fb;font-family:${EMAIL_FONT_STACK};color:#0f172a;">`,
    `  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`,
    '<table role="presentation" class="email-shell" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef3fb" style="padding:24px 12px;background:#eef3fb;">',
    "  <tr>",
    '    <td align="center">',
    '      <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #dbe5f3;overflow:hidden;">',
    "        <tr>",
    '          <td style="padding:28px 28px 22px;background:linear-gradient(135deg,#0b3f91 0%,#0b5fff 55%,#22c1ee 100%);">',
    `            <img src="${escapeHtml(logoUrl)}" alt="TinyGenius Hub" style="display:block;height:72px;width:72px;max-width:100%;border-radius:16px;background:rgba(255,255,255,0.16);padding:4px;" />`,
    '<p style="margin:12px 0 0;color:#dbeafe;font-size:13px;line-height:1.5;">Platform that accompanies parents to build daily study habits</p>',
    `            <h1 style="margin:14px 0 0;color:#ffffff;font-size:24px;line-height:1.35;font-weight:700;">${escapeHtml(title)}</h1>`,
    "          </td>",
    "        </tr>",
    '        <tr><td class="email-body" style="padding:24px 28px 8px;">',
    `          ${bodyHtml}`,
    "        </td></tr>",
    primaryAction?.url
      ? `        <tr><td align="center" style="padding:4px 28px 24px;"><a href="${escapeHtml(primaryAction.url)}" style="display:inline-block;min-width:220px;text-align:center;background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;padding:14px 20px;border-radius:10px;box-shadow:0 8px 20px rgba(11,95,255,0.2);">${escapeHtml(ctaLabel)}</a></td></tr>`
      : "",
    primaryAction?.url
      ? `<tr><td class="email-fallback" align="center" style="padding:0 28px 18px;color:#64748b;font-size:12px;line-height:1.5;">If the button doesn't open, you can <a href="${escapeHtml(primaryAction.url)}" style="color:#0b5fff;text-decoration:none;font-weight:600;">visit this link</a>.</td></tr>`
      : "",
    '        <tr><td style="padding:0 28px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>',
    "        <tr>",
    '          <td class="email-footer" style="padding:16px 28px 26px;color:#64748b;font-size:12px;line-height:1.7;">',
    unsubscribeUrl
      ? `You are receiving email updates from TinyGenius Hub. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0b5fff;text-decoration:none;">Unsubscribe</a>.<br/>`
      : "",
    'If you need support, please respond to this email or contact:',
    `            <a href="${escapeHtml(supportEmailHref)}" style="color:#0b5fff;text-decoration:none;font-weight:600;">${escapeHtml(supportEmail)}</a><br/>`,
    `            © ${year} TinyGenius Hub · ${escapeHtml(CANONICAL_APP_BASE_URL)}`,
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
