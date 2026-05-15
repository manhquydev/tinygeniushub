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
      create: vi.fn(),
      findMany: vi.fn(),
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

import { POST } from "@/app/api/admin/courses/route";

describe("admin courses route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
  });

  it("creates course with normalized pricing and sale window", async () => {
    prismaMock.course.create.mockResolvedValue({
      id: "course-1",
      slug: "mental-math",
      title: "Mental Math",
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 210000,
      saleStartsAt: new Date("2026-03-27T00:00:00.000Z"),
      saleEndsAt: new Date("2026-03-29T00:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/admin/courses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          slug: "mental-math",
          title: "Mental Math",
          description: "Short description",
          priceVnd: 300000,
          listPriceVnd: 300000,
          salePriceVnd: 210000,
          saleStartsAt: "2026-03-27T00:00:00.000Z",
          saleEndsAt: "2026-03-29T00:00:00.000Z",
          durationDays: 30,
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.course.create).toHaveBeenCalledTimes(1);

    const payload = prismaMock.course.create.mock.calls[0][0] as {
      data: {
        priceVnd: number;
        listPriceVnd: number;
        salePriceVnd: number | null;
        saleStartsAt: Date | null;
        saleEndsAt: Date | null;
      };
    };
    expect(payload.data.priceVnd).toBe(300000);
    expect(payload.data.listPriceVnd).toBe(300000);
    expect(payload.data.salePriceVnd).toBe(210000);
    expect(payload.data.saleStartsAt?.toISOString()).toBe("2026-03-27T00:00:00.000Z");
    expect(payload.data.saleEndsAt?.toISOString()).toBe("2026-03-29T00:00:00.000Z");
  });

  it("rejects payload when sale price is higher than regular price", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/courses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          slug: "mental-math",
          title: "Mental Math",
          description: "Short description",
          priceVnd: 300000,
          listPriceVnd: 300000,
          salePriceVnd: 300001,
          durationDays: 30,
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Sale price must be lower than regular price");
    expect(prismaMock.course.create).not.toHaveBeenCalled();
  });

  it("rejects payload when sale window is sent without sale price", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/courses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          slug: "mental-math",
          title: "Mental Math",
          description: "Short description",
          priceVnd: 300000,
          listPriceVnd: 300000,
          saleStartsAt: "2026-03-27T00:00:00.000Z",
          saleEndsAt: "2026-03-29T00:00:00.000Z",
          durationDays: 30,
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Sale window requires a sale price");
    expect(prismaMock.course.create).not.toHaveBeenCalled();
  });
});
