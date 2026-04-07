import { describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    BETTER_AUTH_URL: "https://cungcontuhoc.io.vn",
    REPORT_EMAIL_FROM: "no-reply@cungcontuhoc.io.vn",
    REPORT_EMAIL_REPLY_TO: "support@cungcontuhoc.io.vn",
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

    expect(html).toContain("logo-cungcontuhoc-mascot-email.png");
    expect(html).toContain("Chúng tôi đã nhận yêu cầu hỗ trợ của bạn");
    expect(html).toContain("support@cungcontuhoc.io.vn");
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
