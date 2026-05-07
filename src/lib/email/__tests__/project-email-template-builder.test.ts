import { describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    BETTER_AUTH_URL: "https://tinygeniushubvn.tech",
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
      text: "Xin chào phụ huynh,\n\nNội dung thông báo.",
      tags: [{ name: "feature", value: "contact_form_ack" }],
    });

    expect(html).toContain("logo-tinygeniushub-mascot-email.png");
    expect(html).toContain("Chúng tôi đã nhận yêu cầu hỗ trợ của bạn");
    expect(html).toContain("support@tinygeniushubvn.tech");
    expect(html).toContain("Nền tảng đồng hành cùng phụ huynh");
  });

  it("extracts first URL as CTA", () => {
    const html = renderProjectEmailHtml({
      subject: "Forgot password",
      text: "Bấm vào liên kết sau:\nhttps://example.com/reset?token=abc",
      tags: [{ name: "feature", value: "forgot_password" }],
    });

    expect(html).toContain('href="https://example.com/reset?token=abc"');
    expect(html).toContain("Đặt lại mật khẩu tài khoản");
    expect(html).toContain(">Đặt lại mật khẩu<");
  });

  it("renders centered CTA and unsubscribe footer without exposing raw URL text", () => {
    const unsubscribeUrl = "https://tinygeniushubvn.tech/api/email/marketing/unsubscribe?token=abc123";
    const html = renderProjectEmailHtml({
      subject: "Lifecycle",
      text: [
        "Xin chào phụ huynh,",
        "",
        "Mở dashboard: https://tinygeniushubvn.tech/parent/dashboard",
        "",
        "Nếu bạn không muốn nhận email marketing từ TinyGenius Hub, hủy đăng ký tại đây:",
        unsubscribeUrl,
      ].join("\n"),
      tags: [{ name: "feature", value: "lifecycle" }],
    });

    expect(html).toContain('td align="center" style="padding:4px 28px 24px;"');
    expect(html).toContain(">Mở bảng điều khiển<");
    expect(html).toContain(">Hủy đăng ký<");
    expect(html).not.toContain(`>${unsubscribeUrl}<`);
  });

  it("supports dark-mode-safe metadata and removes legacy unsubscribe prompt lines", () => {
    const html = renderProjectEmailHtml({
      subject: "Reply notification",
      text: [
        "Có phản hồi mới cho bình luận của bạn.",
        "",
        "Xem chi tiết: https://tinygeniushubvn.tech/blog/demo#comments",
        "",
        "Nếu bạn không muốn nhận email thông báo trả lời nữa, bấm link:",
        "https://tinygeniushubvn.tech/api/blog/comments/unsubscribe?token=abc123",
      ].join("\n"),
      tags: [{ name: "feature", value: "blog_comment_reply" }],
    });

    expect(html).toContain('meta name="color-scheme" content="light"');
    expect(html).toContain(">Hủy đăng ký<");
    expect(html).not.toContain("bấm link:");
  });

  it("formats ordered and checklist lines as list items", () => {
    const html = renderProjectEmailHtml({
      subject: "Checklist",
      text: "Các bước:\n\n1) Bật thông báo\n2) Hoàn thành bài học\n\n- [x] Đã xác nhận email\n- [ ] Chưa cấu hình phụ huynh",
      tags: [{ name: "feature", value: "lifecycle" }],
    });

    expect(html).toContain("<ol");
    expect(html).toContain(">Bật thông báo<");
    expect(html).toContain(">☑ Đã xác nhận email<");
    expect(html).toContain(">☐ Chưa cấu hình phụ huynh<");
  });
});
