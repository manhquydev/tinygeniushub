import { randomInt, randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getPublishedCoursesByBundleSlug } from "@/modules/courses/course-bundle-service";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { getEnrollment } from "@/modules/courses/course-service";
import { createPayosPaymentLink } from "@/modules/billing/payos-client";
import {
  createCheckoutReturnState,
  hashCheckoutReturnState,
} from "@/modules/courses/course-checkout-return-state";
import type { PilotAttributionSnapshot } from "@/modules/courses/pilot-attribution";
import { trackPilotCheckoutStarted } from "@/modules/courses/pilot-funnel-tracking-service";
import { DomainError } from "@/modules/platform/errors";
import { createAuditLog } from "@/modules/platform/audit-service";
import { grantCourseOfferingInTx } from "@/modules/entitlement/grant-from-billing";

type CheckoutTarget =
  | {
      kind: "bundle";
      bundleSlug: string;
      entryCourseSlug: string;
      title: string;
      amountVnd: number;
      courseIds: string[];
    }
  | {
      kind: "course";
      courseId: string;
      courseSlug: string;
      title: string;
      amountVnd: number;
      listPriceVnd: number;
    };

type CheckoutSession = {
  checkoutUrl: string;
  externalSessionId: string;
  expiresAt: Date;
};

const PENDING_CHECKOUT_DEDUPE_WINDOW_MINUTES = 20;

function resolveCoursePaymentProvider() {
  return env.COURSE_PAYMENT_PROVIDER;
}

function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, env.BETTER_AUTH_URL).toString();
}

function buildPayosDescription(orderCode: number) {
  // Some receiving-bank integrations cap description at 9 chars.
  return `CCTH${String(orderCode).slice(-5)}`.slice(0, 9);
}

function generatePayosOrderCode() {
  // Keep orderCode in safe integer range for JavaScript and PayOS numeric constraint.
  return Number(`${Date.now().toString().slice(-10)}${randomInt(100, 999)}`);
}

function assertBundleCheckoutAmountAvailable(amountVnd: number) {
  if (amountVnd <= 0) {
    throw new DomainError(
      "Course bundle checkout amount is not available.",
      422,
      "COURSE_PRICE_NOT_AVAILABLE",
    );
  }
}

function assertCourseCheckoutPricingAvailable(pricing: ReturnType<typeof resolveCourseDisplayPricing>) {
  const isTemporaryFree = pricing.statusLabel === "freeTemporary" && pricing.salePriceVnd === 0;
  if (pricing.salePriceVnd > 0 || isTemporaryFree) {
    return;
  }

  throw new DomainError(
    "This course price is not ready for checkout yet.",
    422,
    "COURSE_PRICE_NOT_AVAILABLE",
  );
}

function parseJsonObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function isSameCheckoutTarget(target: CheckoutTarget, rawTarget: Record<string, unknown>) {
  const kind = typeof rawTarget.kind === "string" ? rawTarget.kind : null;

  if (target.kind === "bundle") {
    return kind === "bundle" && rawTarget.bundleSlug === target.bundleSlug;
  }

  return kind === "course" && rawTarget.courseId === target.courseId;
}

function buildMockSuccessUrl(input: {
  amountVnd: number;
  sessionId: string;
  target: CheckoutTarget;
}) {
  const params = new URLSearchParams({
    amountVnd: String(input.amountVnd),
    sessionId: input.sessionId,
  });

  if (input.target.kind === "bundle") {
    params.set("bundleSlug", input.target.bundleSlug);
  } else {
    params.set("courseId", input.target.courseId);
  }

  return `/api/courses/checkout/mock-success?${params.toString()}`;
}

async function findReusablePendingCheckoutSession(input: {
  parentId: string;
  provider: string;
  target: CheckoutTarget;
  amountVnd: number;
}): Promise<CheckoutSession | null> {
  const threshold = addMinutes(new Date(), -PENDING_CHECKOUT_DEDUPE_WINDOW_MINUTES);
  const candidates = await prisma.paymentRecord.findMany({
    where: {
      parentId: input.parentId,
      provider: input.provider,
      status: PaymentStatus.PENDING,
      processedAt: {
        gte: threshold,
      },
    },
    orderBy: {
      processedAt: "desc",
    },
    take: 8,
    select: {
      providerTransactionId: true,
      amountVnd: true,
      processedAt: true,
      rawPayload: true,
    },
  });

  for (const candidate of candidates) {
    if (candidate.amountVnd !== input.amountVnd) {
      continue;
    }

    const rawPayload = parseJsonObject(candidate.rawPayload);
    if (!rawPayload || rawPayload.kind !== "course_checkout") {
      continue;
    }

    const rawTarget = parseJsonObject(rawPayload.target);
    if (!rawTarget || !isSameCheckoutTarget(input.target, rawTarget)) {
      continue;
    }

    if (input.provider === "payos") {
      const payos = parseJsonObject(rawPayload.payos);
      const checkoutUrl =
        payos && typeof payos.checkoutUrl === "string" ? payos.checkoutUrl : null;
      if (!checkoutUrl) {
        continue;
      }

      const expiresAt =
        payos && typeof payos.expiredAt === "number"
          ? new Date(payos.expiredAt * 1000)
          : addMinutes(candidate.processedAt, 30);

      return {
        checkoutUrl,
        externalSessionId: candidate.providerTransactionId,
        expiresAt,
      };
    }

    return {
      checkoutUrl: buildMockSuccessUrl({
        amountVnd: input.amountVnd,
        sessionId: candidate.providerTransactionId,
        target: input.target,
      }),
      externalSessionId: candidate.providerTransactionId,
      expiresAt: addMinutes(candidate.processedAt, 30),
    };
  }

  return null;
}

async function resolveCheckoutTarget(params: { parentId: string; slug: string }): Promise<CheckoutTarget> {
  const bundleResult = await getPublishedCoursesByBundleSlug(params.slug);

  if (bundleResult.bundle) {
    const checkoutCourses =
      bundleResult.courses.length > 0 ? bundleResult.courses : bundleResult.legacyCourses;

    if (checkoutCourses.length === 0) {
      throw new DomainError("Course bundle is not available", 404, "COURSE_BUNDLE_NOT_PUBLISHED");
    }

    const [existingCanonicalEnrollments, existingLegacyEnrollment] = await Promise.all([
      bundleResult.courses.length > 0
        ? prisma.courseEnrollment.findMany({
            where: {
              parentId: params.parentId,
              courseId: {
                in: bundleResult.courses.map((course) => course.id),
              },
            },
            select: {
              courseId: true,
            },
          })
        : Promise.resolve([]),
      bundleResult.legacyCourses.length > 0
        ? prisma.courseEnrollment.findFirst({
            where: {
              parentId: params.parentId,
              courseId: {
                in: bundleResult.legacyCourses.map((course) => course.id),
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const ownsAllCanonicalCourses =
      bundleResult.courses.length > 0 &&
      existingCanonicalEnrollments.length === bundleResult.courses.length;

    if (ownsAllCanonicalCourses || Boolean(existingLegacyEnrollment)) {
      throw new DomainError("Already enrolled in this course bundle", 409, "ALREADY_ENROLLED");
    }

    const bundleAmountVnd = bundleResult.bundle.priceVnd;
    assertBundleCheckoutAmountAvailable(bundleAmountVnd);

    return {
      kind: "bundle",
      bundleSlug: bundleResult.bundle.slug,
      entryCourseSlug: bundleResult.bundle.entryCourseSlug,
      title: bundleResult.bundle.title,
      amountVnd: bundleAmountVnd,
      courseIds: checkoutCourses.map((course) => course.id),
    };
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      isPublished: true,
      priceVnd: true,
      listPriceVnd: true,
      salePriceVnd: true,
      saleStartsAt: true,
      saleEndsAt: true,
    },
  });

  if (!course) {
    throw new DomainError("Course not found", 404, "COURSE_NOT_FOUND");
  }
  if (!course.isPublished) {
    throw new DomainError("Course is not available", 404, "COURSE_NOT_PUBLISHED");
  }

  const pricing = resolveCourseDisplayPricing(course);
  assertCourseCheckoutPricingAvailable(pricing);

  const existing = await getEnrollment(course.id, params.parentId);
  if (existing && pricing.salePriceVnd > 0) {
    throw new DomainError("Already enrolled in this course", 409, "ALREADY_ENROLLED");
  }

  return {
    kind: "course",
    courseId: course.id,
    courseSlug: course.slug,
    title: course.title,
    amountVnd: pricing.salePriceVnd,
    listPriceVnd: pricing.listPriceVnd,
  };
}

async function resolveKidCourseDestination(parentId: string, courseSlug: string) {
  const firstChild = await prisma.childProfile.findFirst({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!firstChild) {
    return `/kid/courses/${encodeURIComponent(courseSlug)}`;
  }

  return `/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(firstChild.id)}`;
}

async function createFreeTemporaryCheckoutSession(input: {
  parentId: string;
  target: Extract<CheckoutTarget, { kind: "course" }>;
}): Promise<CheckoutSession> {
  const { parentId } = input;
  const { courseId, courseSlug } = input.target;

  await prisma.$transaction(async (tx) => {
    await tx.courseEnrollment.upsert({
      where: { courseId_parentId: { courseId, parentId } },
      update: {},
      create: { courseId, parentId },
    });
    await grantCourseOfferingInTx(tx, { parentId, courseId });
  });

  return {
    checkoutUrl: await resolveKidCourseDestination(parentId, courseSlug),
    externalSessionId: `free_course_${randomUUID()}`,
    expiresAt: addMinutes(new Date(), 15),
  };
}

async function createMockCheckoutSession(input: {
  parentId: string;
  target: CheckoutTarget;
  amountVnd: number;
  attribution: PilotAttributionSnapshot | null;
}): Promise<CheckoutSession> {
  const sessionId = `mock_course_${randomUUID()}`;
  const mockSuccessParams = new URLSearchParams({
    amountVnd: String(input.amountVnd),
    sessionId,
  });

  if (input.target.kind === "bundle") {
    mockSuccessParams.set("bundleSlug", input.target.bundleSlug);
  } else {
    mockSuccessParams.set("courseId", input.target.courseId);
  }

  await prisma.paymentRecord.create({
    data: {
      parentId: input.parentId,
      provider: "mock_gateway",
      providerTransactionId: sessionId,
      amountVnd: input.amountVnd,
      status: PaymentStatus.PENDING,
      rawPayload: {
        kind: "course_checkout",
        target: input.target,
        attribution: input.attribution,
      },
    },
  });

  return {
    checkoutUrl: `/api/courses/checkout/mock-success?${mockSuccessParams.toString()}`,
    externalSessionId: sessionId,
    expiresAt: addMinutes(new Date(), 30),
  };
}

async function createPayosCheckoutSession(input: {
  parentId: string;
  parentEmail: string;
  target: CheckoutTarget;
  amountVnd: number;
  attribution: PilotAttributionSnapshot | null;
}): Promise<CheckoutSession> {
  const orderCode = generatePayosOrderCode();
  const orderCodeText = String(orderCode);
  const returnState = createCheckoutReturnState({
    orderCode: orderCodeText,
    parentId: input.parentId,
  });
  const returnStateHash = hashCheckoutReturnState(returnState);

  await prisma.paymentRecord.create({
    data: {
      parentId: input.parentId,
      provider: "payos",
      providerTransactionId: orderCodeText,
      amountVnd: input.amountVnd,
      status: PaymentStatus.PENDING,
      rawPayload: {
        kind: "course_checkout",
        target: input.target,
        attribution: input.attribution,
        payos: {
          returnStateHash,
        },
      },
    },
  });

  try {
    const returnQuery = new URLSearchParams({
      orderCode: orderCodeText,
      state: returnState,
    });
    const returnUrl = buildAbsoluteUrl(`/api/courses/checkout/return?${returnQuery.toString()}`);
    const cancelUrl = buildAbsoluteUrl(`/api/courses/checkout/return?${returnQuery.toString()}&cancel=1`);

    const link = await createPayosPaymentLink({
      orderCode,
      amount: input.amountVnd,
      description: buildPayosDescription(orderCode),
      returnUrl,
      cancelUrl,
      buyerEmail: input.parentEmail,
      items: [
        {
          name: input.target.title.slice(0, 24),
          quantity: 1,
          price: input.amountVnd,
        },
      ],
    });

    await prisma.paymentRecord.update({
      where: {
        provider_providerTransactionId: {
          provider: "payos",
          providerTransactionId: orderCodeText,
        },
      },
      data: {
        rawPayload: {
          kind: "course_checkout",
          target: input.target,
          attribution: input.attribution,
          payos: {
            paymentLinkId: link.paymentLinkId,
            checkoutUrl: link.checkoutUrl,
            orderCode: link.orderCode,
            expiredAt: link.expiredAt ?? null,
            returnStateHash,
          },
        },
      },
    });

    return {
      checkoutUrl: link.checkoutUrl,
      externalSessionId: orderCodeText,
      expiresAt: link.expiredAt ? new Date(link.expiredAt * 1000) : addMinutes(new Date(), 30),
    };
  } catch (error) {
    await prisma.paymentRecord.update({
      where: {
        provider_providerTransactionId: {
          provider: "payos",
          providerTransactionId: orderCodeText,
        },
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    throw error;
  }
}

/** Create a course checkout session. Returns checkoutUrl, discountApplied, finalPriceVnd. */
export async function createCourseCheckoutSession(params: {
  parentId: string;
  parentEmail: string;
  slug: string;
  attribution: PilotAttributionSnapshot | null;
}) {
  const target = await resolveCheckoutTarget({
    parentId: params.parentId,
    slug: params.slug,
  });

  const provider = target.kind === "course" && target.amountVnd === 0
    ? "free_temporary"
    : resolveCoursePaymentProvider();
  const amountVnd = target.amountVnd;

  const reusedPendingSession =
    provider === "free_temporary"
      ? null
      : await findReusablePendingCheckoutSession({
          parentId: params.parentId,
          provider,
          target,
          amountVnd,
        });

  const session =
    reusedPendingSession ??
    (provider === "free_temporary" && target.kind === "course"
      ? await createFreeTemporaryCheckoutSession({
          parentId: params.parentId,
          target,
        })
      : provider === "payos"
        ? await createPayosCheckoutSession({
            parentId: params.parentId,
            parentEmail: params.parentEmail,
            target,
            amountVnd,
            attribution: params.attribution,
          })
        : await createMockCheckoutSession({
            parentId: params.parentId,
            target,
            amountVnd,
            attribution: params.attribution,
          }));
  const checkoutResourceId = `${params.parentId}:${session.externalSessionId}`;
  const existingCheckoutAudit = await prisma.auditLog.findFirst({
    where: {
      actorType: "parent",
      actorId: params.parentId,
      action: "course_checkout_started",
      resourceType: "course_checkout",
      resourceId: checkoutResourceId,
    },
    select: { id: true },
  });

  if (!existingCheckoutAudit) {
    await createAuditLog({
      actorType: "parent",
      actorId: params.parentId,
      action: "course_checkout_started",
      resourceType: "course_checkout",
      resourceId: checkoutResourceId,
      metadata: {
        provider,
        amountVnd,
        sessionId: session.externalSessionId,
        targetKind: target.kind,
        targetSlug: target.kind === "bundle" ? target.bundleSlug : target.courseSlug,
        attributionChannel: params.attribution?.channel ?? "unknown",
        attributionExperimentCoursesVariant: params.attribution?.experimentCoursesVariant ?? null,
        attributionExperimentPricingVariant: params.attribution?.experimentPricingVariant ?? null,
      },
    });
  }

  if (target.kind === "course") {
    await trackPilotCheckoutStarted({
      parentId: params.parentId,
      courseId: target.courseId,
      courseSlug: target.courseSlug,
      sourceSlug: params.slug,
      provider,
      sessionId: session.externalSessionId,
      amountVnd,
      attribution: params.attribution,
    });
  }

  const discountApplied =
    target.kind === "course"
      ? target.listPriceVnd > target.amountVnd
      : false;

  return {
    checkoutUrl: session.checkoutUrl,
    discountApplied,
    finalPriceVnd: amountVnd,
    expiresAt: session.expiresAt,
    sessionId: session.externalSessionId,
    provider,
  };
}
