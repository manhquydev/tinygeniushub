import { OfferingKind } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DomainError } from "@/modules/platform/errors";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  prismaMock: {
    offering: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
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

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { PATCH } from "@/app/api/admin/offerings/[id]/route";

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/offerings/off-1", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("admin offerings PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "owner@example.com",
      role: "SUPER_ADMIN",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    prismaMock.offering.findUnique.mockResolvedValue({ id: "off-1" });
    prismaMock.offering.update.mockResolvedValue({
      id: "off-1",
      code: "platform-pass",
      kind: OfferingKind.RECURRING,
      catalogKey: "platform:pass",
      active: false,
      stripePriceId: null,
    });
  });

  it("toggles active for SUPER_ADMIN after CSRF and rate limit", async () => {
    const request = patchRequest({ active: false });
    const response = await PATCH(request, { params: Promise.resolve({ id: "off-1" }) });
    const body = await response.json();

    expect(assertTrustedOriginMock).toHaveBeenCalledWith(request);
    expect(enforceAdminMutationRateLimitMock).toHaveBeenCalledWith(request);
    expect(requireAdminFromRequestMock).toHaveBeenCalledWith(request, ["SUPER_ADMIN"]);
    expect(prismaMock.offering.update).toHaveBeenCalledWith({
      where: { id: "off-1" },
      data: { active: false },
      select: {
        id: true,
        code: true,
        kind: true,
        catalogKey: true,
        active: true,
        stripePriceId: true,
      },
    });
    expect(response.status).toBe(200);
    expect(body.data.offering.active).toBe(false);
  });

  it("returns early when mutation is rate limited", async () => {
    const rateLimited = new Response(
      JSON.stringify({ ok: false, error: { message: "Too many requests" } }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
    enforceAdminMutationRateLimitMock.mockResolvedValueOnce(rateLimited);

    const response = await PATCH(patchRequest({ active: true }), {
      params: Promise.resolve({ id: "off-1" }),
    });

    expect(response.status).toBe(429);
    expect(requireAdminFromRequestMock).not.toHaveBeenCalled();
    expect(prismaMock.offering.update).not.toHaveBeenCalled();
  });

  it("forbids non-super-admin roles", async () => {
    requireAdminFromRequestMock.mockRejectedValueOnce(
      new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN"),
    );

    const response = await PATCH(patchRequest({ active: true }), {
      params: Promise.resolve({ id: "off-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Forbidden: Insufficient permissions");
    expect(prismaMock.offering.update).not.toHaveBeenCalled();
  });
});
