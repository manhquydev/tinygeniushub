import { describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    BETTER_AUTH_URL: "https://www.tinygeniushubvn.tech",
    REPORT_EMAIL_FROM: "no-reply@tinygeniushubvn.tech",
    REPORT_EMAIL_REPLY_TO: "support@tinygeniushubvn.tech",
  },
}));

vi.mock("@/lib/env", () => ({
  env: envMock,
}));

import { renderProjectEmailHtml } from "@/lib/email/project-email-template-builder";

describe("renderProjectEmailHtml", () => {
  it("renders branded logo and support footer", () => {
    const html = renderProjectEmailHtml({
      subject: "Test Subject",
      text: "Hello parents,\\n\\nNotification content.",
      tags: [{ name: "feature", value: "contact_form_ack" }],
    });

    expect(html).toContain("logo-tinygeniushub-mascot-email.png");
    expect(html).toContain("We have received your support request");
    expect(html).toContain("support@tinygeniushubvn.tech");
    expect(html).toContain("Platform that accompanies parents");
  });

  it("extracts first URL as CTA", () => {
    const html = renderProjectEmailHtml({
      subject: "Forgot password",
      text: "Click on the following link:\\nhttps://example.com/reset?token=abc",
      tags: [{ name: "feature", value: "forgot_password" }],
    });

    expect(html).toContain('href="https://example.com/reset?token=abc"');
    expect(html).toContain("Reset account password");
    expect(html).toContain(">Reset password<");
  });

  it("renders centered CTA and unsubscribe footer without exposing raw URL text", () => {
    const unsubscribeUrl = "https://www.tinygeniushubvn.tech/api/email/marketing/unsubscribe?token=abc123";
    const html = renderProjectEmailHtml({
      subject: "Lifecycle",
      text: [
        "Hello parents,",
        "",
        "Open dashboard: https://www.tinygeniushubvn.tech/parent/dashboard",
        "",
        "If you do not want to receive marketing emails from TinyGenius Hub, unsubscribe here:",
        unsubscribeUrl,
      ].join("\n"),
      tags: [{ name: "feature", value: "lifecycle" }],
    });

    expect(html).toContain('td align="center" style="padding:4px 28px 24px;"');
    expect(html).toContain(">Open control panel<");
    expect(html).toContain(">Unsubscribe<");
    expect(html).not.toContain(`>${unsubscribeUrl}<`);
  });

  it("supports dark-mode-safe metadata and removes legacy unsubscribe prompt lines", () => {
    const html = renderProjectEmailHtml({
      subject: "Reply notification",
      text: [
        "There is a new response to your comment.",
        "",
        "See details: https://www.tinygeniushubvn.tech/blog/demo#comments",
        "",
        "If you no longer want to receive email notification of replies, click the link:",
        "https://www.tinygeniushubvn.tech/api/blog/comments/unsubscribe?token=abc123",
      ].join("\n"),
      tags: [{ name: "feature", value: "blog_comment_reply" }],
    });

    expect(html).toContain('meta name="color-scheme" content="light"');
    expect(html).toContain(">Unsubscribe<");
    expect(html).not.toContain("click link:");
  });

  it("formats ordered and checklist lines as list items", () => {
    const html = renderProjectEmailHtml({
      subject: "Checklist",
      text: "Steps:\\n\\n1) Turn on notifications\\n2) Complete lesson\\n\\n- [x] Email confirmed\\n- [ ] Parents not configured",
      tags: [{ name: "feature", value: "lifecycle" }],
    });

    expect(html).toContain("<ol");
    expect(html).toContain(">Turn on notifications<");
    expect(html).toContain(">☑ Email confirmed<");
    expect(html).toContain(">☐ No parent configured yet<");
  });
});
