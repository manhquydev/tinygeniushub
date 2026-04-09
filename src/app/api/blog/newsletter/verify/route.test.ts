import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifySubscriptionMock } = vi.hoisted(() => ({
  verifySubscriptionMock: vi.fn(),
}));

vi.mock("@/modules/blog/newsletter-service", () => ({
  newsletterService: {
    verifySubscription: verifySubscriptionMock,
  },
}));

vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "https://cungcontuhoc.io.vn"),
}));

import { GET } from "@/app/api/blog/newsletter/verify/route";

describe("blog newsletter verify route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when token is missing", async () => {
    const response = await GET(new Request("http://localhost/api/blog/newsletter/verify"));

    expect(response.status).toBe(400);
  });

  it("redirects to subscribed=false when token is invalid", async () => {
    verifySubscriptionMock.mockResolvedValueOnce(false);

    const response = await GET(new Request("http://localhost/api/blog/newsletter/verify?token=invalid"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cungcontuhoc.io.vn/blog?subscribed=false");
  });

  it("redirects to subscribed=true when token is valid", async () => {
    verifySubscriptionMock.mockResolvedValueOnce(true);

    const response = await GET(new Request("http://localhost/api/blog/newsletter/verify?token=valid"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cungcontuhoc.io.vn/blog?subscribed=true");
  });
});
