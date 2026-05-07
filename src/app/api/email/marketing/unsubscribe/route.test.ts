import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  parseTokenMock,
  verifyTokenMock,
  parentFindUniqueMock,
  parentPreferencesUpsertMock,
} = vi.hoisted(() => ({
  parseTokenMock: vi.fn(),
  verifyTokenMock: vi.fn(),
  parentFindUniqueMock: vi.fn(),
  parentPreferencesUpsertMock: vi.fn(),
}));

vi.mock("@/modules/platform/marketing-email-unsubscribe-token", () => ({
  parseMarketingEmailUnsubscribeToken: parseTokenMock,
  verifyMarketingEmailUnsubscribeToken: verifyTokenMock,
}));

vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "https://tinygeniushubvn.tech"),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    parentAccount: {
      findUnique: parentFindUniqueMock,
    },
    parentPreferences: {
      upsert: parentPreferencesUpsertMock,
    },
  },
}));

import { GET } from "@/app/api/email/marketing/unsubscribe/route";

describe("marketing email unsubscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parentPreferencesUpsertMock.mockResolvedValue({});
  });

  it("returns invalid-link page when token cannot be parsed", async () => {
    parseTokenMock.mockReturnValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/email/marketing/unsubscribe?token=abc12345678901234567"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Liên kết hủy đăng ký không hợp lệ.");
    expect(parentFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns not-found page when parent account no longer exists", async () => {
    parseTokenMock.mockReturnValueOnce({ parentId: "parent-1", signature: "sig" });
    parentFindUniqueMock.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/email/marketing/unsubscribe?token=abc12345678901234567"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Không tìm thấy tài khoản tương ứng với liên kết này.");
  });

  it("returns invalid page when token signature does not match", async () => {
    parseTokenMock.mockReturnValueOnce({ parentId: "parent-1", signature: "sig" });
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-1",
      email: "parent@example.com",
    });
    verifyTokenMock.mockReturnValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/email/marketing/unsubscribe?token=abc12345678901234567"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Liên kết hủy đăng ký không hợp lệ hoặc đã hết hạn.");
    expect(parentPreferencesUpsertMock).not.toHaveBeenCalled();
  });

  it("marks marketing opt-in false and returns success page", async () => {
    parseTokenMock.mockReturnValueOnce({ parentId: "parent-1", signature: "sig" });
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-1",
      email: "parent@example.com",
    });
    verifyTokenMock.mockReturnValueOnce("parent-1");

    const response = await GET(
      new Request("http://localhost/api/email/marketing/unsubscribe?token=abc12345678901234567"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(parentPreferencesUpsertMock).toHaveBeenCalledWith({
      where: { parentId: "parent-1" },
      create: {
        parentId: "parent-1",
        weeklyReportChannel: "IN_APP_AND_EMAIL",
        weeklyReportEmailEnabled: true,
        marketingEmailOptIn: false,
        timezone: "Asia/Bangkok",
      },
      update: {
        marketingEmailOptIn: false,
      },
    });
    expect(html).toContain("Bạn đã hủy nhận email marketing thành công.");
  });
});
