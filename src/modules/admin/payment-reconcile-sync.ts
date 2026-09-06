import type { Prisma } from "@prisma/client";
import {
  getBundleCourseSlugFilters,
  getCourseBundleByBundleSlug,
  isCanonicalSplitCourseSlug,
  isLegacyMonolithCourseSlug,
} from "@/modules/courses/course-bundles";
import { grantCourseOfferingInTx } from "@/modules/entitlement/grant-from-billing";
import { DomainError } from "@/modules/platform/errors";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function uniqueStringList(values: unknown[]) {
  const set = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    set.add(normalized);
  }

  return [...set];
}

async function resolveCourseIdsFromCheckoutTarget(tx: Prisma.TransactionClient, rawPayload: unknown) {
  const raw = asRecord(rawPayload);
  const target = asRecord(raw?.target);
  if (!target) {
    return [];
  }

  const targetKind = typeof target.kind === "string" ? target.kind : null;
  if (targetKind === "course") {
    const courseId = typeof target.courseId === "string" ? target.courseId.trim() : "";
    return courseId ? [courseId] : [];
  }

  if (targetKind !== "bundle") {
    return [];
  }

  const targetCourseIds = Array.isArray(target.courseIds)
    ? uniqueStringList(target.courseIds)
    : [];
  if (targetCourseIds.length > 0) {
    const rows = await tx.course.findMany({
      where: {
        id: {
          in: targetCourseIds,
        },
      },
      select: {
        id: true,
      },
    });
    return rows.map((row) => row.id);
  }

  const bundleSlug = typeof target.bundleSlug === "string" ? target.bundleSlug.trim() : "";
  if (!bundleSlug) {
    return [];
  }

  const bundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!bundle) {
    return [];
  }

  const rows = await tx.course.findMany({
    where: {
      OR: getBundleCourseSlugFilters(bundle),
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (rows.length === 0) {
    return [];
  }

  const splitRows = rows.filter((row) => isCanonicalSplitCourseSlug(bundle, row.slug));
  if (splitRows.length > 0) {
    return splitRows.map((row) => row.id);
  }

  const nonLegacyRows = rows.filter((row) => !isLegacyMonolithCourseSlug(bundle, row.slug));
  if (nonLegacyRows.length > 0) {
    return nonLegacyRows.map((row) => row.id);
  }

  return rows.map((row) => row.id);
}

export async function syncEnrollmentsFromPaymentTarget(input: {
  tx: Prisma.TransactionClient;
  parentId: string;
  paymentRecordId: string;
  rawPayload: unknown;
}) {
  const courseIds = await resolveCourseIdsFromCheckoutTarget(input.tx, input.rawPayload);
  if (courseIds.length === 0) {
    throw new DomainError(
      "Unable to resolve course list from payment target.",
      409,
      "PAYMENT_RECONCILE_TARGET_INVALID",
    );
  }

  let syncedEnrollmentCount = 0;
  for (const courseId of courseIds) {
    await input.tx.courseEnrollment.upsert({
      where: {
        courseId_parentId: {
          courseId,
          parentId: input.parentId,
        },
      },
      update: {
        paymentId: input.paymentRecordId,
      },
      create: {
        courseId,
        parentId: input.parentId,
        paymentId: input.paymentRecordId,
      },
    });
    await grantCourseOfferingInTx(input.tx, {
      parentId: input.parentId,
      courseId,
      sourcePaymentId: input.paymentRecordId,
    });
    syncedEnrollmentCount += 1;
  }

  return {
    courseIds,
    syncedEnrollmentCount,
  };
}
