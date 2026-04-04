/**
 * Package Subscription Service
 * Handles business logic for package subscriptions
 */

import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { PackageSubscriptionStatus, type ChildProfile, type CurriculumPackage, type PackageSubscription, type Prisma } from "@prisma/client";
import { z } from "zod";
import { calculateYearlySavings, getPackageConfig, getUpgradeOptions, type PackageCode, packageCodeSchema } from "./package-config";
import { getPayablePlanConfig, payablePlanCodeSchema, toPrismaPlanCode } from "./plan-config";
import { resolveBillingProvider } from "./providers";
import { resolveCheckoutAbsoluteUrl } from "./checkout-service";
import { createAuditLog } from "@/modules/platform/audit-service";

// Schemas
export const getCurrentPackageSchema = z.object({
  childId: z.string().optional(),
});

export const upgradePackageSchema = z.object({
  targetPackageId: z.string(),
  childId: z.string().optional(),
  prorate: z.boolean().default(true),
  successPath: z.string().min(1).optional().default("/parent/dashboard"),
  cancelPath: z.string().min(1).optional().default("/pricing"),
});

// Types
export interface PackageWithSubscription {
  package: CurriculumPackage;
  subscription: {
    status: PackageSubscriptionStatus;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
  accessibleGrades: string[];
  accessibleVideoCount: number;
}

export interface UpgradeResult {
  checkoutUrl: string;
  proratedAmount: number;
  currentPackageId: string;
  targetPackageId: string;
  currency: string;
}

// List all available packages
export async function listPackages(): Promise<{
  id: string;
  code: string;
  name: string;
  description: string;
  grades: string[];
  subjects: string[];
  videoCount: number;
  monthlyPrice: number;
  yearlyPrice: number;
  savings: number;
}[]> {
  const packages = await prisma.curriculumPackage.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return packages.map((pkg) => ({
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    description: pkg.description || "",
    grades: pkg.grades,
    subjects: pkg.subjects,
    videoCount: pkg.videoCount,
    monthlyPrice: pkg.monthlyPrice,
    yearlyPrice: pkg.yearlyPrice,
    savings: calculateYearlySavings(pkg.monthlyPrice, pkg.yearlyPrice),
  }));
}

// Get user's active package for a specific child
export async function getCurrentPackage(
  parentId: string,
  childId?: string
): Promise<PackageWithSubscription | null> {
  // If childId provided, get package for that child
  if (childId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId },
      include: {
        packageSubscriptions: {
          where: {
            status: { in: [PackageSubscriptionStatus.ACTIVE] },
            endDate: { gte: new Date() },
          },
          include: { package: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!child) {
      throw new DomainError("Child not found", 404, "CHILD_NOT_FOUND");
    }

    const activeSubscription = child.packageSubscriptions[0];
    if (!activeSubscription) {
      return null;
    }

    return formatPackageWithSubscription(activeSubscription.package, activeSubscription, child);
  }

  // Get parent's account-level subscription (from the new system)
  const accountSubscription = await prisma.packageSubscription.findFirst({
    where: {
      parentId,
      childId: null, // Account-level subscription
      status: { in: [PackageSubscriptionStatus.ACTIVE] },
      endDate: { gte: new Date() },
    },
    include: { package: true },
    orderBy: { endDate: "desc" },
  });

  if (accountSubscription) {
    return formatPackageWithSubscription(
      accountSubscription.package,
      accountSubscription,
      null
    );
  }

  // Fall back to legacy Subscription model
  const legacySubscription = await prisma.subscription.findUnique({
    where: { parentId },
  });

  if (legacySubscription && 
      legacySubscription.status !== "EXPIRED" && 
      legacySubscription.status !== "TRIALING") {
    // Map legacy subscription to package
    const mappedPackage = await mapLegacyPlanToPackage(legacySubscription.planCode);
    if (mappedPackage) {
      return formatPackageWithSubscription(
        mappedPackage,
        {
          status: PackageSubscriptionStatus.ACTIVE,
          startDate: legacySubscription.currentPeriodStart,
          endDate: legacySubscription.currentPeriodEnd,
          autoRenew: legacySubscription.autoRenew,
        } as PackageSubscription,
        null
      );
    }
  }

  return null;
}

// Map legacy plan codes to curriculum packages
async function mapLegacyPlanToPackage(planCode: string): Promise<CurriculumPackage | null> {
  const mapping: Record<string, string> = {
    "YEARLY_STANDARD": "ELEMENTARY_PRO",
    "YEARLY_FAMILY_PLUS": "ULTIMATE_FULL",
    "MONTHLY_STANDARD": "ELEMENTARY_PRO",
  };

  const packageCode = mapping[planCode];
  if (!packageCode) return null;

  return prisma.curriculumPackage.findFirst({
    where: { code: packageCode },
  });
}

// Format package with subscription for response
function formatPackageWithSubscription(
  pkg: CurriculumPackage,
  subscription: PackageSubscription | { status: PackageSubscriptionStatus; startDate: Date; endDate: Date; autoRenew: boolean },
  child: ChildProfile | null
): PackageWithSubscription {
  return {
    package: pkg,
    subscription: {
      status: subscription.status,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      autoRenew: subscription.autoRenew,
    },
    accessibleGrades: pkg.grades,
    accessibleVideoCount: pkg.videoCount,
  };
}

// Calculate prorated upgrade cost
export async function calculateProratedUpgrade(
  currentPackageId: string,
  targetPackageId: string,
  parentId: string
): Promise<{ proratedAmount: number; currentYearlyPrice: number; targetYearlyPrice: number }> {
  const [currentPackage, targetPackage, currentSubscription] = await Promise.all([
    prisma.curriculumPackage.findUnique({ where: { id: currentPackageId } }),
    prisma.curriculumPackage.findUnique({ where: { id: targetPackageId } }),
    prisma.packageSubscription.findFirst({
      where: {
        parentId,
        status: PackageSubscriptionStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: "desc" },
    }),
  ]);

  if (!currentPackage || !targetPackage) {
    throw new DomainError("Package not found", 404, "PACKAGE_NOT_FOUND");
  }

  const targetPrice = targetPackage.yearlyPrice;
  const currentPrice = currentPackage.yearlyPrice;

  // If no active subscription or upgrading from lower tier
  if (!currentSubscription) {
    return {
      proratedAmount: targetPrice,
      currentYearlyPrice: currentPrice,
      targetYearlyPrice: targetPrice,
    };
  }

  // Calculate remaining value of current subscription
  const now = new Date();
  const endDate = new Date(currentSubscription.endDate);
  const startDate = new Date(currentSubscription.startDate);
  const totalDuration = endDate.getTime() - startDate.getTime();
  const remainingDuration = Math.max(0, endDate.getTime() - now.getTime());
  
  const remainingValue = Math.round(
    currentPrice * (remainingDuration / totalDuration)
  );

  // Calculate prorated amount for upgrade
  const proratedAmount = Math.max(0, targetPrice - remainingValue);

  return {
    proratedAmount,
    currentYearlyPrice: currentPrice,
    targetYearlyPrice: targetPrice,
  };
}

// Create upgrade checkout session
export async function createUpgradeCheckout(
  parentId: string,
  input: z.infer<typeof upgradePackageSchema>
): Promise<UpgradeResult> {
  const payload = upgradePackageSchema.parse(input);

  // Get parent info
  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    select: { id: true, email: true },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  // Get target package
  const targetPackage = await prisma.curriculumPackage.findUnique({
    where: { id: payload.targetPackageId },
  });

  if (!targetPackage) {
    throw new DomainError("Target package not found", 404, "PACKAGE_NOT_FOUND");
  }

  // Get current active subscription
  const currentSubscription = await prisma.packageSubscription.findFirst({
    where: {
      parentId,
      status: PackageSubscriptionStatus.ACTIVE,
      endDate: { gte: new Date() },
    },
    include: { package: true },
    orderBy: { endDate: "desc" },
  });

  let proratedAmount = targetPackage.yearlyPrice;
  let currentPackageId = currentSubscription?.packageId || "";

  // Calculate prorated amount if applicable
  if (payload.prorate && currentSubscription) {
    const { proratedAmount: prorated } = await calculateProratedUpgrade(
      currentSubscription.packageId,
      payload.targetPackageId,
      parentId
    );
    proratedAmount = prorated;
    currentPackageId = currentSubscription.packageId;
  }

  // Create checkout session with billing provider
  const provider = resolveBillingProvider();
  const successUrl = resolveCheckoutAbsoluteUrl(payload.successPath);
  const cancelUrl = resolveCheckoutAbsoluteUrl(payload.cancelPath);

  const session = await provider.createCheckoutSession({
    parentId: parent.id,
    parentEmail: parent.email,
    planCode: targetPackage.code as PackageCode,
    amountVnd: proratedAmount,
    successUrl,
    cancelUrl,
    metadata: {
      upgrade: "true",
      currentPackageId,
      targetPackageId: payload.targetPackageId,
      childId: payload.childId || "",
      prorated: payload.prorate ? "true" : "false",
    },
  });

  // Create audit log
  await createAuditLog({
    actorType: "parent",
    actorId: parent.id,
    action: "package.upgrade.checkout.created",
    resourceType: "checkout_session",
    resourceId: session.externalSessionId,
    metadata: {
      provider: session.provider,
      targetPackageId: payload.targetPackageId,
      targetPackageCode: targetPackage.code,
      proratedAmount,
      currentPackageId,
      childId: payload.childId,
    },
  });

  return {
    checkoutUrl: session.checkoutUrl,
    proratedAmount,
    currentPackageId,
    targetPackageId: payload.targetPackageId,
    currency: "VND",
  };
}

// Get available upgrade options for a parent
export async function getAvailableUpgrades(parentId: string, childId?: string): Promise<{
  currentPackage: CurriculumPackage | null;
  upgradeOptions: CurriculumPackage[];
}> {
  const current = await getCurrentPackage(parentId, childId);
  
  if (!current) {
    // No current package - return all packages as options
    const allPackages = await prisma.curriculumPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    return { currentPackage: null, upgradeOptions: allPackages };
  }

  // Get upgrade options from config
  const configOptions = getUpgradeOptions(current.package.code as PackageCode);
  
  // Fetch full package details from DB
  const upgradeCodes = configOptions.map(o => o.code);
  const upgradeOptions = await prisma.curriculumPackage.findMany({
    where: { 
      code: { in: upgradeCodes },
      isActive: true 
    },
    orderBy: { displayOrder: "asc" },
  });

  return {
    currentPackage: current.package,
    upgradeOptions,
  };
}

// Check if a child has access to a specific grade
export async function hasGradeAccess(
  parentId: string,
  childId: string,
  grade: string
): Promise<boolean> {
  const current = await getCurrentPackage(parentId, childId);
  if (!current) return false;
  
  return current.accessibleGrades.includes(grade.toLowerCase());
}

// Check if a child has access to a specific video/lesson
export async function hasVideoAccess(
  parentId: string,
  childId: string,
  lessonId: string
): Promise<boolean> {
  // Get the lesson's grade
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { level: { include: { track: true } } } } },
  });

  if (!lesson) return false;

  // Map track/level to grade
  const trackCode = lesson.unit.level.track.code;
  const levelOrder = lesson.unit.level.orderNo;
  
  // This is a simplified mapping - adjust based on your actual grade mapping
  const grade = mapTrackLevelToGrade(trackCode, levelOrder);
  
  return hasGradeAccess(parentId, childId, grade);
}

// Helper to map track/level to grade
function mapTrackLevelToGrade(trackCode: string, levelOrder: number): string {
  // Simplified mapping - adjust based on your actual curriculum structure
  const gradeMap: Record<number, string> = {
    1: "k4",
    2: "k5",
    3: "g1",
    4: "g2",
    5: "g3",
    6: "g4",
    7: "g5",
    8: "g6",
    9: "g7",
    10: "g8",
    11: "g9",
    12: "g10",
    13: "g11",
    14: "g12",
  };
  
  return gradeMap[levelOrder] || "g1";
}
