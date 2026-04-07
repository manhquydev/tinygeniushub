import { beforeEach, describe, expect, it, vi } from "vitest";

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
    course: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

import { PATCH } from "@/app/api/admin/courses/[id]/route";

describe("admin course detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
  });

  it("returns 404 when course does not exist", async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/admin/courses/course-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ title: "Updated title" }),
      }) as never,
      { params: Promise.resolve({ id: "course-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Course not found");
    expect(prismaMock.course.update).not.toHaveBeenCalled();
  });

  it("normalizes pricing payload when patching sale configuration", async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      id: "course-1",
      slug: "toan-tu-duy",
      title: "Toan tu duy",
      description:
        "Mo ta khoa hoc du do dai de pass quality gate khi test normalize pricing payload.",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      durationDays: 30,
      coverImageUrl: null,
      isPublished: false,
    });
    prismaMock.course.update.mockResolvedValue({
      id: "course-1",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 220000,
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/courses/course-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          salePriceVnd: 220000,
          saleStartsAt: "2026-03-27T00:00:00.000Z",
          saleEndsAt: "2026-03-29T00:00:00.000Z",
        }),
      }) as never,
      { params: Promise.resolve({ id: "course-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const updatePayload = prismaMock.course.update.mock.calls[0][0] as {
      data: {
        salePriceVnd: number | null;
        saleStartsAt: Date | null;
        saleEndsAt: Date | null;
      };
    };
    expect(updatePayload.data.salePriceVnd).toBe(220000);
    expect(updatePayload.data.saleStartsAt?.toISOString()).toBe("2026-03-27T00:00:00.000Z");
    expect(updatePayload.data.saleEndsAt?.toISOString()).toBe("2026-03-29T00:00:00.000Z");
  });

  it("rejects incomplete sale window in patch payload", async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      id: "course-1",
      slug: "toan-tu-duy",
      title: "Toan tu duy",
      description:
        "Mo ta khoa hoc du do dai de pass quality gate khi test reject incomplete sale window.",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      durationDays: 30,
      coverImageUrl: null,
      isPublished: false,
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/courses/course-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          salePriceVnd: 220000,
          saleStartsAt: "2026-03-27T00:00:00.000Z",
        }),
      }) as never,
      { params: Promise.resolve({ id: "course-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Sale start and end time must be set together");
    expect(prismaMock.course.update).not.toHaveBeenCalled();
  });

  it("allows publishing a zero-priced temporary course", async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      id: "course-1",
      slug: "toan-tu-duy",
      title: "Toan tu duy",
      description:
        "Mo ta khoa hoc du do dai de pass quality gate khi publish course zero-priced temporary.",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      durationDays: 30,
      coverImageUrl: null,
      isPublished: false,
    });
    prismaMock.course.update.mockResolvedValue({
      id: "course-1",
      priceVnd: 0,
      listPriceVnd: 0,
      salePriceVnd: null,
      isPublished: true,
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/courses/course-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          priceVnd: 0,
          listPriceVnd: 0,
          isPublished: true,
        }),
      }) as never,
      { params: Promise.resolve({ id: "course-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const updatePayload = prismaMock.course.update.mock.calls[0][0] as {
      data: {
        priceVnd: number;
        listPriceVnd: number;
        salePriceVnd: number | null;
        saleStartsAt: Date | null;
        saleEndsAt: Date | null;
        isPublished: boolean;
      };
    };
    expect(updatePayload.data.priceVnd).toBe(0);
    expect(updatePayload.data.listPriceVnd).toBe(0);
    expect(updatePayload.data.salePriceVnd).toBeNull();
    expect(updatePayload.data.saleStartsAt).toBeNull();
    expect(updatePayload.data.saleEndsAt).toBeNull();
    expect(updatePayload.data.isPublished).toBe(true);
  });

  it("rejects publish when description is too short", async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      id: "course-1",
      slug: "toan-tu-duy",
      title: "Toan tu duy",
      description: "Mo ta ngan",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
      durationDays: 30,
      coverImageUrl: null,
      isPublished: false,
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/courses/course-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ isPublished: true }),
      }) as never,
      { params: Promise.resolve({ id: "course-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.details.code).toBe("COURSE_PUBLISH_DESCRIPTION_TOO_SHORT");
    expect(prismaMock.course.update).not.toHaveBeenCalled();
  });
});
