import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    paymentRecord: {
      findMany: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { getRevenueMetrics, getRevenueTimeSeries } from "@/modules/admin/admin-revenue-service";

describe("admin-revenue-service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-11T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates revenue metrics from successful course checkout payments and enrollments", async () => {
    prismaMock.paymentRecord.findMany.mockResolvedValue([
      {
        id: "pay-bundle",
        parentId: "parent-1",
        amountVnd: 300_000,
        processedAt: new Date("2026-04-10T09:00:00.000Z"),
        rawPayload: { kind: "course_checkout", target: { kind: "bundle" } },
      },
      {
        id: "pay-course",
        parentId: "parent-2",
        amountVnd: 100_000,
        processedAt: new Date("2026-04-05T09:00:00.000Z"),
        rawPayload: { kind: "course_checkout", target: { kind: "course" } },
      },
      {
        id: "pay-other-flow",
        parentId: "parent-3",
        amountVnd: 500_000,
        processedAt: new Date("2026-04-09T09:00:00.000Z"),
        rawPayload: { kind: "package_checkout" },
      },
    ]);
    prismaMock.courseEnrollment.findMany.mockResolvedValue([
      {
        paymentId: "pay-bundle",
        courseId: "course-a",
        course: { slug: "khoa-a", title: "Khóa A" },
      },
      {
        paymentId: "pay-bundle",
        courseId: "course-b",
        course: { slug: "khoa-b", title: "Khóa B" },
      },
      {
        paymentId: "pay-course",
        courseId: "course-a",
        course: { slug: "khoa-a", title: "Khóa A" },
      },
    ]);

    const result = await getRevenueMetrics();

    expect(result.totalRevenue30d).toBe(400_000);
    expect(result.totalRevenue7d).toBe(400_000);
    expect(result.courseOrderCount30d).toBe(2);
    expect(result.courseOrderCount7d).toBe(2);
    expect(result.uniqueBuyers30d).toBe(2);
    expect(result.successfulEnrollments30d).toBe(3);
    expect(result.averageOrderValue30d).toBe(200_000);
    expect(result.revenueByProduct).toEqual({
      COURSE_SINGLE: 100_000,
      COURSE_BUNDLE: 300_000,
      COURSE_OTHER: 0,
    });
    expect(result.topCourses30d).toEqual([
      {
        courseId: "course-a",
        courseSlug: "khoa-a",
        title: "Khóa A",
        enrollmentCount: 2,
        revenueVnd: 250_000,
      },
      {
        courseId: "course-b",
        courseSlug: "khoa-b",
        title: "Khóa B",
        enrollmentCount: 1,
        revenueVnd: 150_000,
      },
    ]);

    expect(result.mrr).toBe(400_000);
    expect(result.churnRate).toBe(0);
    expect(result.revenueByPlan).toEqual({
      STANDARD: 100_000,
      FAMILYPLUS: 300_000,
      TRIAL: 0,
    });
  });

  it("returns daily series with paid orders and enrollment counts", async () => {
    prismaMock.paymentRecord.findMany.mockResolvedValue([
      {
        id: "pay-1",
        parentId: "parent-1",
        amountVnd: 120_000,
        processedAt: new Date("2026-04-10T09:00:00.000Z"),
        rawPayload: { kind: "course_checkout", target: { kind: "course" } },
      },
      {
        id: "pay-2",
        parentId: "parent-1",
        amountVnd: 180_000,
        processedAt: new Date("2026-04-11T10:00:00.000Z"),
        rawPayload: { kind: "course_checkout", target: { kind: "bundle" } },
      },
    ]);
    prismaMock.courseEnrollment.findMany.mockResolvedValue([
      { paymentId: "pay-1" },
      { paymentId: "pay-2" },
      { paymentId: "pay-2" },
    ]);

    const result = await getRevenueTimeSeries(3);

    expect(result).toEqual([
      {
        date: "2026-04-09",
        revenue: 0,
        paidOrders: 0,
        successfulEnrollments: 0,
        newCustomers: 0,
        churnedCustomers: 0,
      },
      {
        date: "2026-04-10",
        revenue: 120_000,
        paidOrders: 1,
        successfulEnrollments: 1,
        newCustomers: 1,
        churnedCustomers: 0,
      },
      {
        date: "2026-04-11",
        revenue: 180_000,
        paidOrders: 1,
        successfulEnrollments: 2,
        newCustomers: 1,
        churnedCustomers: 0,
      },
    ]);
  });
});
