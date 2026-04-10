import { PaymentStatus } from "@prisma/client";
import { format, subDays } from "date-fns";
import { prisma } from "@/lib/db";

type CourseCheckoutPayment = {
  id: string;
  parentId: string;
  amountVnd: number;
  processedAt: Date;
  rawPayload: unknown;
};

type ProductRevenueBucket = "COURSE_SINGLE" | "COURSE_BUNDLE" | "COURSE_OTHER";

export interface RevenueMetrics {
  totalRevenue30d: number;
  totalRevenue7d: number;
  courseOrderCount30d: number;
  courseOrderCount7d: number;
  uniqueBuyers30d: number;
  successfulEnrollments30d: number;
  averageOrderValue30d: number;
  revenueByProduct: Record<ProductRevenueBucket, number>;
  topCourses30d: Array<{
    courseId: string;
    courseSlug: string;
    title: string;
    enrollmentCount: number;
    revenueVnd: number;
  }>;
  // Legacy fields kept for one compatibility cycle.
  mrr: number;
  arr: number;
  revenueByPlan: Record<string, number>;
  churnRate: number;
  churnRevenue30d: number;
  netRevenueRetention: number;
  newMrr30d: number;
  expansionMrr30d: number;
  contractionMrr30d: number;
}

export interface RevenueTimeSeries {
  date: string;
  revenue: number;
  paidOrders: number;
  successfulEnrollments: number;
  newCustomers: number;
  // Legacy field kept for one compatibility cycle.
  churnedCustomers: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function isCourseCheckoutPayment(payload: unknown): boolean {
  const raw = asRecord(payload);
  if (!raw) return false;
  return raw.kind === "course_checkout";
}

function resolveProductBucket(payload: unknown): ProductRevenueBucket {
  const raw = asRecord(payload);
  const target = asRecord(raw?.target);
  if (!target) return "COURSE_OTHER";
  if (target.kind === "bundle") return "COURSE_BUNDLE";
  if (target.kind === "course") return "COURSE_SINGLE";
  return "COURSE_OTHER";
}

async function listSuccessfulCourseCheckoutPayments(since: Date): Promise<CourseCheckoutPayment[]> {
  const rows = await prisma.paymentRecord.findMany({
    where: {
      status: PaymentStatus.SUCCEEDED,
      processedAt: { gte: since },
    },
    select: {
      id: true,
      parentId: true,
      amountVnd: true,
      processedAt: true,
      rawPayload: true,
    },
    orderBy: { processedAt: "asc" },
  });

  return rows.filter((row) => isCourseCheckoutPayment(row.rawPayload));
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const now = new Date();
  const since30d = subDays(now, 30);
  const since7d = subDays(now, 7);

  const coursePayments30d = await listSuccessfulCourseCheckoutPayments(since30d);
  const paymentIds30d = coursePayments30d.map((payment) => payment.id);

  const enrollments30d =
    paymentIds30d.length === 0
      ? []
      : await prisma.courseEnrollment.findMany({
          where: {
            paymentId: { in: paymentIds30d },
          },
          select: {
            paymentId: true,
            courseId: true,
            course: {
              select: {
                slug: true,
                title: true,
              },
            },
          },
        });

  const payments7d = coursePayments30d.filter((payment) => payment.processedAt >= since7d);

  const revenueByProduct: Record<ProductRevenueBucket, number> = {
    COURSE_SINGLE: 0,
    COURSE_BUNDLE: 0,
    COURSE_OTHER: 0,
  };
  for (const payment of coursePayments30d) {
    const bucket = resolveProductBucket(payment.rawPayload);
    revenueByProduct[bucket] += payment.amountVnd;
  }

  const enrollmentsByPaymentId = new Map<
    string,
    Array<{
      paymentId: string | null;
      courseId: string;
      course: { slug: string; title: string };
    }>
  >();
  for (const enrollment of enrollments30d) {
    if (!enrollment.paymentId) continue;
    const current = enrollmentsByPaymentId.get(enrollment.paymentId) ?? [];
    current.push(enrollment);
    enrollmentsByPaymentId.set(enrollment.paymentId, current);
  }

  const topCourseAccumulator = new Map<
    string,
    {
      courseId: string;
      courseSlug: string;
      title: string;
      enrollmentCount: number;
      revenueVnd: number;
    }
  >();
  for (const payment of coursePayments30d) {
    const paymentEnrollments = enrollmentsByPaymentId.get(payment.id) ?? [];
    if (paymentEnrollments.length === 0) continue;
    const allocatedRevenue = payment.amountVnd / paymentEnrollments.length;

    for (const enrollment of paymentEnrollments) {
      const key = enrollment.courseId;
      const current = topCourseAccumulator.get(key) ?? {
        courseId: enrollment.courseId,
        courseSlug: enrollment.course.slug,
        title: enrollment.course.title,
        enrollmentCount: 0,
        revenueVnd: 0,
      };
      current.enrollmentCount += 1;
      current.revenueVnd += allocatedRevenue;
      topCourseAccumulator.set(key, current);
    }
  }

  const totalRevenue30d = coursePayments30d.reduce((sum, payment) => sum + payment.amountVnd, 0);
  const totalRevenue7d = payments7d.reduce((sum, payment) => sum + payment.amountVnd, 0);
  const courseOrderCount30d = coursePayments30d.length;
  const uniqueBuyers30d = new Set(coursePayments30d.map((payment) => payment.parentId)).size;
  const averageOrderValue30d =
    courseOrderCount30d > 0 ? Math.round(totalRevenue30d / courseOrderCount30d) : 0;

  const topCourses30d = Array.from(topCourseAccumulator.values())
    .map((item) => ({
      ...item,
      revenueVnd: Math.round(item.revenueVnd),
    }))
    .sort((a, b) => {
      if (b.revenueVnd !== a.revenueVnd) return b.revenueVnd - a.revenueVnd;
      return b.enrollmentCount - a.enrollmentCount;
    })
    .slice(0, 8);

  // Legacy compatibility: keep old keys for one API cycle while UI migrates.
  const legacyRevenueByPlan: Record<string, number> = {
    STANDARD: revenueByProduct.COURSE_SINGLE,
    FAMILYPLUS: revenueByProduct.COURSE_BUNDLE,
    TRIAL: 0,
  };

  return {
    totalRevenue30d,
    totalRevenue7d,
    courseOrderCount30d,
    courseOrderCount7d: payments7d.length,
    uniqueBuyers30d,
    successfulEnrollments30d: enrollments30d.length,
    averageOrderValue30d,
    revenueByProduct,
    topCourses30d,
    mrr: totalRevenue30d,
    arr: totalRevenue30d * 12,
    revenueByPlan: legacyRevenueByPlan,
    churnRate: 0,
    churnRevenue30d: 0,
    netRevenueRetention: 100,
    newMrr30d: totalRevenue30d,
    expansionMrr30d: 0,
    contractionMrr30d: 0,
  };
}

export async function getRevenueTimeSeries(days: number = 30): Promise<RevenueTimeSeries[]> {
  const safeDays = Number.isFinite(days) ? Math.max(1, Math.min(120, Math.floor(days))) : 30;
  const now = new Date();
  const since = subDays(now, safeDays - 1);
  const coursePayments = await listSuccessfulCourseCheckoutPayments(since);
  const paymentIds = coursePayments.map((payment) => payment.id);

  const enrollments =
    paymentIds.length === 0
      ? []
      : await prisma.courseEnrollment.findMany({
          where: {
            paymentId: { in: paymentIds },
          },
          select: {
            paymentId: true,
          },
        });

  const paymentDateById = new Map(
    coursePayments.map((payment) => [payment.id, format(payment.processedAt, "yyyy-MM-dd")]),
  );
  const revenueByDate = new Map<string, number>();
  const ordersByDate = new Map<string, number>();
  const buyersByDate = new Map<string, Set<string>>();
  const enrollmentsByDate = new Map<string, number>();

  for (const payment of coursePayments) {
    const dateKey = format(payment.processedAt, "yyyy-MM-dd");
    revenueByDate.set(dateKey, (revenueByDate.get(dateKey) ?? 0) + payment.amountVnd);
    ordersByDate.set(dateKey, (ordersByDate.get(dateKey) ?? 0) + 1);

    const buyers = buyersByDate.get(dateKey) ?? new Set<string>();
    buyers.add(payment.parentId);
    buyersByDate.set(dateKey, buyers);
  }

  for (const enrollment of enrollments) {
    if (!enrollment.paymentId) continue;
    const dateKey = paymentDateById.get(enrollment.paymentId);
    if (!dateKey) continue;
    enrollmentsByDate.set(dateKey, (enrollmentsByDate.get(dateKey) ?? 0) + 1);
  }

  const series: RevenueTimeSeries[] = [];
  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const date = subDays(now, i);
    const dateKey = format(date, "yyyy-MM-dd");
    series.push({
      date: dateKey,
      revenue: revenueByDate.get(dateKey) ?? 0,
      paidOrders: ordersByDate.get(dateKey) ?? 0,
      successfulEnrollments: enrollmentsByDate.get(dateKey) ?? 0,
      newCustomers: buyersByDate.get(dateKey)?.size ?? 0,
      churnedCustomers: 0,
    });
  }

  return series;
}
