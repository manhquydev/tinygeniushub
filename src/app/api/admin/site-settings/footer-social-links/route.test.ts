import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DomainError } from "@/modules/platform/errors";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  createAdminActionLogMock,
  getFooterSocialLinksMock,
  updateFooterSocialLinksMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  createAdminActionLogMock: vi.fn(),
  getFooterSocialLinksMock: vi.fn(),
  updateFooterSocialLinksMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: enforceAdminMutationRateLimitMock,
}));

vi.mock("@/modules/admin/service", () => ({
  createAdminActionLog: createAdminActionLogMock,
}));

vi.mock("@/modules/platform/site-content-settings-service", () => ({
  getFooterSocialLinks: getFooterSocialLinksMock,
  updateFooterSocialLinks: updateFooterSocialLinksMock,
}));

import { GET, PATCH } from "@/app/api/admin/site-settings/footer-social-links/route";

const BASE_LINKS = {
  facebook: "https://facebook.com/tinygeniushub",
  youtube: "https://youtube.com/@TinyGeniusHubUs",
};

describe("admin footer social links route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    createAdminActionLogMock.mockResolvedValue({
      id: "log-1",
    });
    getFooterSocialLinksMock.mockResolvedValue(BASE_LINKS);
    updateFooterSocialLinksMock.mockResolvedValue(BASE_LINKS);
  });

  it("GET returns current links when authorized", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/admin/site-settings/footer-social-links"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        links: BASE_LINKS,
      },
    });
    expect(requireAdminFromRequestMock).toHaveBeenCalledTimes(1);
    expect(getFooterSocialLinksMock).toHaveBeenCalledTimes(1);
  });

  it("GET maps auth failure to route error payload", async () => {
    requireAdminFromRequestMock.mockRejectedValueOnce(
      new DomainError("Unauthorized", 401, "UNAUTHORIZED"),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/admin/site-settings/footer-social-links"),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Unauthorized");
    expect(body.error.details).toEqual({ code: "UNAUTHORIZED" });
  });

  it("PATCH returns early when rate-limited", async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({
        ok: false,
        error: { message: "Too many requests" },
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
        },
      },
    );
    enforceAdminMutationRateLimitMock.mockResolvedValueOnce(rateLimitResponse);

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/site-settings/footer-social-links", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ links: BASE_LINKS }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Too many requests");
    expect(updateFooterSocialLinksMock).not.toHaveBeenCalled();
  });

  it("PATCH validates payload and returns 400 when invalid", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/site-settings/footer-social-links", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          links: { facebook: "not-a-url" },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Invalid request payload.");
    expect(updateFooterSocialLinksMock).not.toHaveBeenCalled();
  });

  it("PATCH updates links and writes admin action log", async () => {
    const nextLinks = {
      facebook: "https://facebook.com/new-page",
      youtube: "https://youtube.com/@new-channel",
    };
    updateFooterSocialLinksMock.mockResolvedValueOnce(nextLinks);

    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/site-settings/footer-social-links", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          links: nextLinks,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        links: nextLinks,
      },
    });
    expect(assertTrustedOriginMock).toHaveBeenCalledTimes(1);
    expect(updateFooterSocialLinksMock).toHaveBeenCalledWith({
      actorId: "admin-1",
      input: nextLinks,
    });
    expect(createAdminActionLogMock).toHaveBeenCalledWith({
      adminEmail: "admin@example.com",
      action: "UPDATE_FOOTER_SOCIAL_LINKS",
      target: "footer_social_links",
      detail: nextLinks,
    });
  });
});
