import { beforeEach, describe, expect, it, vi } from "vitest";

const { unsubscribeMock } = vi.hoisted(() => ({
  unsubscribeMock: vi.fn(),
}));

vi.mock("@/modules/blog/newsletter-service", () => ({
  newsletterService: {
    unsubscribe: unsubscribeMock,
  },
}));

vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "https://cungcontuhoc.io.vn"),
}));

import { GET } from "@/app/api/blog/newsletter/unsubscribe/route";

describe("blog newsletter unsubscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes and redirects to blog when token is present", async () => {
    unsubscribeMock.mockResolvedValueOnce(undefined);

    const response = await GET(new Request("http://localhost/api/blog/newsletter/unsubscribe?token=abc"));

    expect(unsubscribeMock).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cungcontuhoc.io.vn/blog?unsubscribed=true");
  });

  it("still redirects when token is missing", async () => {
    const response = await GET(new Request("http://localhost/api/blog/newsletter/unsubscribe"));

    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cungcontuhoc.io.vn/blog?unsubscribed=true");
  });
});
