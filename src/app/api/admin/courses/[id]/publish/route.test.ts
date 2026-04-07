import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  requireAdminFromRequestMock,
  findUniqueMock,
  updateMock,
  resolveCourseDisplayPricingMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  requireAdminFromRequestMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  resolveCourseDisplayPricingMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: enforceAdminMutationRateLimitMock,
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    course: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock("@/modules/courses/course-pricing", () => ({
  resolveCourseDisplayPricing: resolveCourseDisplayPricingMock,
}));

import { POST } from "@/app/api/admin/courses/[id]/publish/route";

function buildRequest(body: unknown = {}) {
  return new NextRequest("http://localhost/api/admin/courses/course-1/publish", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("admin course publish route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
    });
  });

  it("returns 404 when course is missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await POST(buildRequest({ isPublished: true }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("blocks publish when sale window is invalid", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: false,
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 200000,
      saleStartsAt: "2026-03-27T10:00:00.000Z",
      saleEndsAt: "2026-03-27T08:00:00.000Z",
      description:
        "Mo ta khoa hoc du do dai de pass quality gate truoc khi kiem tra sale window invalid.",
    });
    resolveCourseDisplayPricingMock.mockReturnValueOnce({
      salePriceVnd: 300000,
      listPriceVnd: 300000,
      hasDiscount: false,
      isPurchasable: true,
      statusLabel: "pending",
      saleStatus: "invalid",
      saleStartsAt: new Date("2026-03-27T10:00:00.000Z"),
      saleEndsAt: new Date("2026-03-27T08:00:00.000Z"),
    });

    const response = await POST(buildRequest({ isPublished: true }), {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.details.code).toBe("COURSE_PUBLISH_PRICING_INVALID");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("publishes zero-priced temporary courses", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: false,
      priceVnd: 0,
      listPriceVnd: null,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      description:
        "Mo ta khoa hoc mien phi tam thoi du 80 ky tu de route publish khong bi chan boi quality gate.",
    });
    resolveCourseDisplayPricingMock.mockReturnValueOnce({
      salePriceVnd: 0,
      listPriceVnd: 0,
      hasDiscount: false,
      isPurchasable: false,
      statusLabel: "freeTemporary",
      saleStatus: "none",
      saleStartsAt: null,
      saleEndsAt: null,
    });
    updateMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: true,
    });

    const response = await POST(buildRequest({ isPublished: true }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "course-1" },
      data: { isPublished: true },
    });
  });

  it("publishes when pricing is valid", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: false,
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 250000,
      saleStartsAt: null,
      saleEndsAt: null,
      description:
        "Mo ta khoa hoc thuong mai du do dai de pass quality gate truoc khi kiem tra pricing.",
    });
    resolveCourseDisplayPricingMock.mockReturnValueOnce({
      salePriceVnd: 250000,
      listPriceVnd: 300000,
      hasDiscount: true,
      isPurchasable: true,
      statusLabel: "ready",
      saleStatus: "active",
      saleStartsAt: null,
      saleEndsAt: null,
    });
    updateMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: true,
    });

    const response = await POST(buildRequest({ isPublished: true }), {
      params: Promise.resolve({ id: "course-1" }),
    });

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "course-1" },
      data: { isPublished: true },
    });
  });

  it("blocks publish when description is too short", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "course-1",
      isPublished: false,
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      description: "Mo ta ngan",
    });

    const response = await POST(buildRequest({ isPublished: true }), {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.details.code).toBe("COURSE_PUBLISH_DESCRIPTION_TOO_SHORT");
    expect(updateMock).not.toHaveBeenCalled();
  });
});
