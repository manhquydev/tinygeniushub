import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PackageValidator,
  PLAN_CONFIGS,
} from '../package-validator';
import { PlanCode, SubscriptionStatus } from '@prisma/client';

// Create mock functions
const mockFindUnique = vi.fn();
const mockCount = vi.fn();

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    childProfile: {
      count: (...args: any[]) => mockCount(...args),
    },
    caregiverAccount: {
      count: (...args: any[]) => mockCount(...args),
    },
  },
}));

describe('PackageValidator', () => {
  let validator: PackageValidator;
  
  const mockParentId = 'parent_123';
  
  beforeEach(() => {
    validator = new PackageValidator();
    vi.clearAllMocks();
  });
  
  describe('validateSubscription', () => {
    it('should return invalid when no subscription exists', async () => {
      mockFindUnique.mockResolvedValue(null);
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.planCode).toBeNull();
    });
    
    it('should return valid for active subscription', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.planCode).toBe(PlanCode.MONTHLY_STANDARD);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return invalid for expired subscription', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.EXPIRED,
        currentPeriodEnd: new Date('2024-01-01'),
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should return invalid for cancelled subscription', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
        currentPeriodEnd: new Date('2024-01-01'), // Already expired
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('expired') || e.includes('cancel'))).toBe(true);
    });
    
    it('should return warning for subscription expiring soon', async () => {
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: fiveDaysFromNow,
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('5 days'))).toBe(true);
      expect(result.daysRemaining).toBe(5);
    });
    
    it('should handle grace period status', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.GRACE,
        currentPeriodEnd: futureDate,
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      // Grace period is considered valid but with warning
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('extended'))).toBe(true);
    });
    
    it('should handle refunded subscription', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.REFUNDED,
        currentPeriodEnd: new Date('2025-12-31'),
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('refund'))).toBe(true);
    });
    
    it('should include plan name in result', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.YEARLY_FAMILY_PLUS,
        status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
        currentPeriodEnd: futureDate,
      });
      
      const result = await validator.validateSubscription(mockParentId);
      
      expect(result.planName).toBe('Full Course PRO');
    });
  });
  
  describe('checkChildProfileLimit', () => {
    it('should allow adding children when under limit', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        childProfileLimit: 3,
      });
      mockCount.mockResolvedValue(2);
      
      const result = await validator.checkChildProfileLimit(mockParentId);
      
      expect(result.withinLimit).toBe(true);
      expect(result.currentCount).toBe(2);
      expect(result.maxAllowed).toBe(3);
      expect(result.canAddMore).toBe(1);
    });
    
    it('should prevent adding children when at limit', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        childProfileLimit: 3,
      });
      mockCount.mockResolvedValue(3);
      
      const result = await validator.checkChildProfileLimit(mockParentId);
      
      expect(result.withinLimit).toBe(false);
      expect(result.canAddMore).toBe(0);
    });
    
    it('should use default limit when subscription is null', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCount.mockResolvedValue(2);
      
      const result = await validator.checkChildProfileLimit(mockParentId);
      
      expect(result.maxAllowed).toBe(3); // Default
    });
  });
  
  describe('checkCaregiverLimit', () => {
    it('should use correct limits for each plan', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.YEARLY_FAMILY_PLUS,
        caregiverLimit: 5,
      });
      mockCount.mockResolvedValue(3);
      
      const result = await validator.checkCaregiverLimit(mockParentId);
      
      expect(result.maxAllowed).toBe(5);
      expect(result.withinLimit).toBe(true);
      expect(result.canAddMore).toBe(2);
    });
  });
  
  describe('getPackageUsageStats', () => {
    it('should return comprehensive usage stats', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        childProfileLimit: 3,
        caregiverLimit: 2,
        currentPeriodEnd: futureDate,
        status: SubscriptionStatus.ACTIVE_STANDARD,
      });
      
      // Mock child and caregiver counts
      mockCount
        .mockResolvedValueOnce(2) // childProfile count
        .mockResolvedValueOnce(1); // caregiverAccount count
      
      const result = await validator.getPackageUsageStats(mockParentId);
      
      expect(result.childProfilesUsed).toBe(2);
      expect(result.childProfilesLimit).toBe(3);
      expect(result.caregiversUsed).toBe(1);
      expect(result.caregiversLimit).toBe(2);
      expect(result.daysUntilExpiration).toBe(30);
      expect(result.isInGracePeriod).toBe(false);
    });
    
    it('should return null daysUntilExpiration when expired', async () => {
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        childProfileLimit: 3,
        caregiverLimit: 2,
        currentPeriodEnd: new Date('2024-01-01'),
        status: SubscriptionStatus.EXPIRED,
      });
      mockCount.mockResolvedValue(0);
      
      const result = await validator.getPackageUsageStats(mockParentId);
      
      expect(result.daysUntilExpiration).toBeNull();
    });
    
    it('should return zeros when no subscription', async () => {
      mockFindUnique.mockResolvedValue(null);
      
      const result = await validator.getPackageUsageStats(mockParentId);
      
      expect(result.childProfilesUsed).toBe(0);
      expect(result.childProfilesLimit).toBe(0);
    });
  });
  
  describe('isSubscriptionActive', () => {
    it('should return true for valid active subscription', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const subscription = {
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      } as any;
      
      expect(validator.isSubscriptionActive(subscription)).toBe(true);
    });
    
    it('should return true for trial subscription', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const subscription = {
        status: SubscriptionStatus.TRIALING,
        currentPeriodEnd: futureDate,
      } as any;
      
      expect(validator.isSubscriptionActive(subscription)).toBe(true);
    });
    
    it('should return true for grace period', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const subscription = {
        status: SubscriptionStatus.GRACE,
        currentPeriodEnd: futureDate,
      } as any;
      
      expect(validator.isSubscriptionActive(subscription)).toBe(true);
    });
    
    it('should return false for expired subscription', () => {
      const subscription = {
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: new Date('2024-01-01'),
      } as any;
      
      expect(validator.isSubscriptionActive(subscription)).toBe(false);
    });
    
    it('should return false for cancelled subscription', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const subscription = {
        status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
        currentPeriodEnd: futureDate,
      } as any;
      
      expect(validator.isSubscriptionActive(subscription)).toBe(false);
    });
    
    it('should return false for null subscription', () => {
      expect(validator.isSubscriptionActive(null)).toBe(false);
    });
  });
  
  describe('getPlanConfig', () => {
    it('should return correct config for each plan', () => {
      const trial = validator.getPlanConfig(PlanCode.TRIAL);
      expect(trial?.maxChildren).toBe(1);
      expect(trial?.maxCaregivers).toBe(0);
      expect(trial?.isPaid).toBe(false);
      
      const monthly = validator.getPlanConfig(PlanCode.MONTHLY_STANDARD);
      expect(monthly?.maxChildren).toBe(3);
      expect(monthly?.isPaid).toBe(true);
      
      const family = validator.getPlanConfig(PlanCode.YEARLY_FAMILY_PLUS);
      expect(family?.maxChildren).toBe(5);
      expect(family?.maxCaregivers).toBe(5);
    });
  });
  
  describe('getAllPlanConfigs', () => {
    it('should return all plan configs', () => {
      const configs = validator.getAllPlanConfigs();
      
      expect(configs).toHaveLength(4);
      expect(configs.map(c => c.code)).toContain(PlanCode.TRIAL);
      expect(configs.map(c => c.code)).toContain(PlanCode.MONTHLY_STANDARD);
      expect(configs.map(c => c.code)).toContain(PlanCode.YEARLY_STANDARD);
      expect(configs.map(c => c.code)).toContain(PlanCode.YEARLY_FAMILY_PLUS);
    });
  });
});

describe('PLAN_CONFIGS', () => {
  it('should have correct limits for TRIAL', () => {
    expect(PLAN_CONFIGS[PlanCode.TRIAL].maxChildren).toBe(1);
    expect(PLAN_CONFIGS[PlanCode.TRIAL].maxCaregivers).toBe(0);
    expect(PLAN_CONFIGS[PlanCode.TRIAL].isPaid).toBe(false);
  });
  
  it('should have correct limits for MONTHLY_STANDARD', () => {
    expect(PLAN_CONFIGS[PlanCode.MONTHLY_STANDARD].maxChildren).toBe(3);
    expect(PLAN_CONFIGS[PlanCode.MONTHLY_STANDARD].maxCaregivers).toBe(2);
  });
  
  it('should have correct limits for YEARLY_STANDARD', () => {
    expect(PLAN_CONFIGS[PlanCode.YEARLY_STANDARD].maxChildren).toBe(3);
    expect(PLAN_CONFIGS[PlanCode.YEARLY_STANDARD].maxCaregivers).toBe(2);
  });
  
  it('should have correct limits for YEARLY_FAMILY_PLUS', () => {
    expect(PLAN_CONFIGS[PlanCode.YEARLY_FAMILY_PLUS].maxChildren).toBe(5);
    expect(PLAN_CONFIGS[PlanCode.YEARLY_FAMILY_PLUS].maxCaregivers).toBe(5);
  });
});
