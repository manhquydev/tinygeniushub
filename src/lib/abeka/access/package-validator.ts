import { prisma } from '@/lib/prisma';
import { 
  Subscription, 
  SubscriptionStatus, 
  PlanCode,
  ParentAccount,
  ChildProfile,
} from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface PackageValidationResult {
  isValid: boolean;
  isActive: boolean;
  isExpired: boolean;
  expiresAt: Date | null;
  daysRemaining: number;
  planCode: PlanCode | null;
  planName: string | null;
  errors: string[];
  warnings: string[];
}

export interface ChildLimitCheck {
  withinLimit: boolean;
  currentCount: number;
  maxAllowed: number;
  canAddMore: number;
}

export interface PackageUsageStats {
  childProfilesUsed: number;
  childProfilesLimit: number;
  caregiversUsed: number;
  caregiversLimit: number;
  daysUntilExpiration: number | null;
  isInGracePeriod: boolean;
}

// ============================================================================
// Plan Configuration
// ============================================================================

export interface PlanConfig {
  code: PlanCode;
  name: string;
  maxChildren: number;
  maxCaregivers: number;
  isPaid: boolean;
}

export const PLAN_CONFIGS: Record<PlanCode, PlanConfig> = {
  [PlanCode.TRIAL]: {
    code: PlanCode.TRIAL,
    name: 'Try it out',
    maxChildren: 1,
    maxCaregivers: 0,
    isPaid: false,
  },
  [PlanCode.MONTHLY_STANDARD]: {
    code: PlanCode.MONTHLY_STANDARD,
    name: 'PRO Elementary - Month',
    maxChildren: 3,
    maxCaregivers: 2,
    isPaid: true,
  },
  [PlanCode.YEARLY_STANDARD]: {
    code: PlanCode.YEARLY_STANDARD,
    name: 'PRO Elementary - Year',
    maxChildren: 3,
    maxCaregivers: 2,
    isPaid: true,
  },
  [PlanCode.YEARLY_FAMILY_PLUS]: {
    code: PlanCode.YEARLY_FAMILY_PLUS,
    name: 'Full Course PRO',
    maxChildren: 5,
    maxCaregivers: 5,
    isPaid: true,
  },
};

// ============================================================================
// Package Validator
// ============================================================================

export class PackageValidator {
  
  /**
   * Validate a user's subscription status
   * 
   * Performs comprehensive checks:
   * - Subscription exists
   * - Status is valid (not expired/cancelled)
   * - Current period has not ended
   * - Within usage limits
   * 
   * @param userId - Parent account ID
   * @returns Promise<PackageValidationResult>
   */
  async validateSubscription(userId: string): Promise<PackageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Fetch subscription with parent
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      include: { parent: true },
    });
    
    // No subscription found
    if (!subscription) {
      errors.push('No subscription found. Please subscribe to the package to continue.');
      return {
        isValid: false,
        isActive: false,
        isExpired: true,
        expiresAt: null,
        daysRemaining: 0,
        planCode: null,
        planName: null,
        errors,
        warnings,
      };
    }
    
    const now = new Date();
    const config = PLAN_CONFIGS[subscription.planCode];
    const isExpired = subscription.currentPeriodEnd < now;
    
    // Check subscription status
    const activeStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.ACTIVE_STANDARD,
      SubscriptionStatus.ACTIVE_FAMILYPLUS,
      SubscriptionStatus.GRACE,
    ];
    
    const isActive = activeStatuses.includes(subscription.status);
    
    if (!isActive) {
      switch (subscription.status) {
        case SubscriptionStatus.EXPIRED:
          errors.push('Subscription has expired. Please renew to continue.');
          break;
        case SubscriptionStatus.CANCELED_AT_PERIOD_END:
          if (!isExpired) {
            warnings.push('Subscription will expire at the end of the period. Please extend to avoid interruption.');
          } else {
            errors.push('Subscription has been canceled and expired.');
          }
          break;
        case SubscriptionStatus.REFUNDED:
          errors.push('The subscription has been refunded and is no longer valid.');
          break;
        default:
          errors.push(`Invalid package status: ${subscription.status}`);
      }
    }

    if (subscription.status === SubscriptionStatus.GRACE) {
      warnings.push('Subscription has been extended during grace period. Please renew soon.');
    }
    
    // Check expiration
    if (isExpired && !errors.some(e => e.includes('expired'))) {
      errors.push('Subscription has expired. Please renew to continue.');
    }
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));
    
    // Warn if expiring soon (within 7 days)
    if (isActive && daysRemaining <= 7 && daysRemaining > 0) {
      const dayLabel = daysRemaining === 1 ? 'day' : 'days';
      warnings.push(`The subscription will expire in ${daysRemaining} ${dayLabel}. Please renew soon!`);
    }
    
    return {
      isValid: errors.length === 0,
      isActive,
      isExpired,
      expiresAt: subscription.currentPeriodEnd,
      daysRemaining,
      planCode: subscription.planCode,
      planName: config?.name ?? subscription.planCode,
      errors,
      warnings,
    };
  }
  
  /**
   * Check if user can add more child profiles
   * 
   * @param userId - Parent account ID
   * @returns Promise<ChildLimitCheck>
   */
  async checkChildProfileLimit(userId: string): Promise<ChildLimitCheck> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      select: { planCode: true, childProfileLimit: true },
    });
    
    const maxAllowed = subscription?.childProfileLimit ?? 3;
    
    // Count current children
    const currentCount = await prisma.childProfile.count({
      where: { parentId: userId },
    });
    
    return {
      withinLimit: currentCount < maxAllowed,
      currentCount,
      maxAllowed,
      canAddMore: Math.max(0, maxAllowed - currentCount),
    };
  }
  
  /**
   * Check if user can add more caregivers
   * 
   * @param userId - Parent account ID
   * @returns Promise<ChildLimitCheck> (reusing same interface for caregivers)
   */
  async checkCaregiverLimit(userId: string): Promise<ChildLimitCheck> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
      select: { planCode: true, caregiverLimit: true },
    });
    
    const maxAllowed = subscription?.caregiverLimit ?? 2;
    
    // Count current caregivers
    const currentCount = await prisma.caregiverAccount.count({
      where: { parentId: userId },
    });
    
    return {
      withinLimit: currentCount < maxAllowed,
      currentCount,
      maxAllowed,
      canAddMore: Math.max(0, maxAllowed - currentCount),
    };
  }
  
  /**
   * Get comprehensive usage statistics for a user's package
   * 
   * @param userId - Parent account ID
   * @returns Promise<PackageUsageStats>
   */
  async getPackageUsageStats(userId: string): Promise<PackageUsageStats> {
    const subscription = await prisma.subscription.findUnique({
      where: { parentId: userId },
    });
    
    if (!subscription) {
      return {
        childProfilesUsed: 0,
        childProfilesLimit: 0,
        caregiversUsed: 0,
        caregiversLimit: 0,
        daysUntilExpiration: null,
        isInGracePeriod: false,
      };
    }
    
    const [childCount, caregiverCount] = await Promise.all([
      prisma.childProfile.count({ where: { parentId: userId } }),
      prisma.caregiverAccount.count({ where: { parentId: userId } }),
    ]);
    
    const now = new Date();
    const daysUntilExpiration = subscription.currentPeriodEnd > now
      ? Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      childProfilesUsed: childCount,
      childProfilesLimit: subscription.childProfileLimit,
      caregiversUsed: caregiverCount,
      caregiversLimit: subscription.caregiverLimit,
      daysUntilExpiration,
      isInGracePeriod: subscription.status === SubscriptionStatus.GRACE,
    };
  }
  
  /**
   * Quick check if subscription is active and valid
   * 
   * @param subscription - Subscription object
   * @returns boolean
   */
  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    
    const activeStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.ACTIVE_STANDARD,
      SubscriptionStatus.ACTIVE_FAMILYPLUS,
      SubscriptionStatus.GRACE,
    ];
    
    if (!activeStatuses.includes(subscription.status)) {
      return false;
    }
    
    const now = new Date();
    return subscription.currentPeriodEnd >= now;
  }
  
  /**
   * Get plan configuration
   * 
   * @param planCode - Plan code
   * @returns PlanConfig | undefined
   */
  getPlanConfig(planCode: PlanCode): PlanConfig | undefined {
    return PLAN_CONFIGS[planCode];
  }
  
  /**
   * Get all available plan configurations
   * 
   * @returns PlanConfig[]
   */
  getAllPlanConfigs(): PlanConfig[] {
    return Object.values(PLAN_CONFIGS);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const packageValidator = new PackageValidator();
